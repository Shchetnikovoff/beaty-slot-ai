import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords, getSyncedClients, getSyncedStaff, getSyncedServices } from '@/lib/sync-store';
import type { YclientsRecord } from '@/lib/yclients';

/**
 * Типы для платежей
 */
type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

interface PaymentItem {
  id: number;
  record_id: number;
  client_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  staff_id: string;
  staff_name: string;
  service_id: string;
  service_name: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  description: string;
  created_at: string;
  paid_at?: string;
  visit_date: string;
  source: 'yclients' | 'native';
  // Оригинальные данные из YClients для отображения реального статуса
  yclients_data: {
    paid_full: number;
    attendance: number; // 2=ожидает, 1=пришёл, 0=нет инфо, -1=неявка
    visit_attendance: number;
    confirmed: number; // 1=подтверждён
    deleted: boolean;
    online: boolean;
    seance_length: number;
    prepaid: string;
    prepaid_confirmed: boolean;
  };
}

/**
 * Определить статус платежа из записи YClients
 *
 * Логика YClients:
 * - paid_full: 1 = полностью оплачено
 * - attendance: 2 = ожидает, 1 = клиент пришёл, 0 = нет инфо, -1 = неявка
 * - confirmed: 1 = подтверждено
 * - deleted: true = удалено/отменено
 */
function getPaymentStatus(record: YclientsRecord): PaymentStatus {
  // Удалённая запись = отменённый платёж
  if (record.deleted) return 'CANCELLED';

  // Неявка клиента = платёж отменён
  if (record.attendance === -1) return 'CANCELLED';

  // Полностью оплачено
  if (record.paid_full === 1) return 'SUCCEEDED';

  // Клиент пришёл (attendance = 1), но не оплачено = ожидает оплаты
  if (record.attendance === 1) return 'PENDING';

  // Запись подтверждена, клиент ещё не пришёл = в обработке
  if (record.confirmed === 1) return 'PROCESSING';

  // Ожидает подтверждения (attendance = 2 или 0) = ожидает
  return 'PENDING';
}

/**
 * Получить человекочитаемый статус посещения
 */
function getAttendanceLabel(attendance: number): string {
  switch (attendance) {
    case 2: return 'Ожидает';
    case 1: return 'Пришёл';
    case 0: return 'Нет информации';
    case -1: return 'Неявка';
    default: return 'Неизвестно';
  }
}

/**
 * GET /api/v1/admin/payments/data
 * Получить платежи из синхронизированных данных YClients
 *
 * Query params:
 *   - status: фильтр по статусу
 *   - date_from: начало периода (YYYY-MM-DD)
 *   - date_to: конец периода (YYYY-MM-DD)
 *   - limit: лимит записей (по умолчанию 100)
 *   - skip: смещение (по умолчанию 0)
 */
export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();
    const clients = getSyncedClients();
    const staff = getSyncedStaff();
    const services = getSyncedServices();

    // Получить параметры запроса
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as PaymentStatus | null;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    // Создать карты для быстрого поиска
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    const staffMap = new Map(staff.map(s => [s.id, s]));
    const servicesMap = new Map(services.map(s => [s.id, s]));

    // Преобразовать записи в платежи
    let payments: PaymentItem[] = records
      .filter(r => r.services && r.services.length > 0) // Только записи с услугами
      .map((r, index) => {
        const client = r.client ? clientsMap.get(r.client.id) : null;
        const staffMember = staffMap.get(r.staff_id);
        const firstService = r.services[0];
        const service = firstService ? servicesMap.get(firstService.id) : null;

        // Общая сумма услуг
        const totalAmount = r.services.reduce((sum, svc) => sum + (svc.cost || 0), 0);

        const status = getPaymentStatus(r);

        return {
          id: r.id,
          record_id: r.id,
          client_id: r.client ? String(r.client.id) : '0',
          client_name: r.client?.name || client?.name || 'Неизвестный клиент',
          client_phone: r.client?.phone || client?.phone || '',
          client_email: r.client?.email || client?.email || '',
          staff_id: String(r.staff_id),
          staff_name: staffMember?.name || 'Неизвестный мастер',
          service_id: firstService ? String(firstService.id) : '0',
          service_name: r.services.map(s => s.title).join(', ') || 'Услуга',
          amount: totalAmount,
          currency: 'RUB',
          status,
          payment_method: r.online ? 'Онлайн-запись' : 'Запись в салоне',
          description: r.comment || '',
          created_at: r.create_date || r.datetime,
          visit_date: r.datetime,
          paid_at: status === 'SUCCEEDED' ? r.last_change_date || r.datetime : undefined,
          source: 'yclients' as const,
          // Оригинальные данные из YClients
          yclients_data: {
            paid_full: r.paid_full,
            attendance: r.attendance,
            visit_attendance: r.visit_attendance,
            confirmed: r.confirmed,
            deleted: r.deleted,
            online: r.online,
            seance_length: r.seance_length,
            prepaid: r.prepaid,
            prepaid_confirmed: r.prepaid_confirmed,
          },
        };
      });

    // Фильтрация по статусу
    if (statusFilter) {
      payments = payments.filter(p => p.status === statusFilter);
    }

    // Фильтрация по дате
    if (dateFrom) {
      payments = payments.filter(p => {
        const paymentDate = p.created_at.split(' ')[0];
        return paymentDate >= dateFrom;
      });
    }
    if (dateTo) {
      payments = payments.filter(p => {
        const paymentDate = p.created_at.split(' ')[0];
        return paymentDate <= dateTo;
      });
    }

    // Сортировка по дате (новые сначала)
    payments.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const total = payments.length;

    // Пагинация
    const paginatedPayments = payments.slice(skip, skip + limit);

    // Статистика
    const stats = {
      total,
      succeeded: payments.filter(p => p.status === 'SUCCEEDED').length,
      pending: payments.filter(p => p.status === 'PENDING').length,
      processing: payments.filter(p => p.status === 'PROCESSING').length,
      cancelled: payments.filter(p => p.status === 'CANCELLED').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      succeededAmount: payments
        .filter(p => p.status === 'SUCCEEDED')
        .reduce((sum, p) => sum + p.amount, 0),
    };

    return NextResponse.json({
      items: paginatedPayments,
      total,
      skip,
      limit,
      stats,
    });
  } catch (error) {
    console.error('Error getting payments data:', error);
    return NextResponse.json(
      { error: 'Failed to get payments data' },
      { status: 500 }
    );
  }
}
