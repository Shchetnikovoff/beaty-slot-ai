import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords, getSyncedStaff, getSyncedClients } from '@/lib/sync-store';
import type { Appointment, AppointmentStatus, AppointmentsListResponse } from '@/types/appointment';
import type { YclientsRecord } from '@/lib/yclients';

/**
 * Преобразовать статус YClients в статус админки
 * YClients attendance: -1 = не пришёл, 0 = ожидание, 1 = пришёл, 2 = подтверждён
 */
function mapStatus(record: YclientsRecord): AppointmentStatus {
  if (record.deleted) return 'CANCELLED';
  if (record.attendance === -1) return 'NO_SHOW';
  if (record.attendance === 1) return 'COMPLETED';
  if (record.confirmed === 1) return 'CONFIRMED';
  return 'PENDING';
}

/**
 * Преобразовать YclientsRecord в Appointment (формат админки)
 */
function transformRecord(
  record: YclientsRecord,
  staffMap: Map<number, { name: string }>,
  clientsMap: Map<number, { name: string; phone: string }>
): Appointment {
  const staff = staffMap.get(record.staff_id);
  const client = record.client ? clientsMap.get(record.client.id) : undefined;

  // Рассчитать общую стоимость услуг
  const totalPrice = record.services.reduce((sum, s) => sum + s.cost, 0);

  return {
    id: record.id,
    client_id: record.client ? String(record.client.id) : '',
    staff_id: record.staff_id,
    service_id: record.services[0]?.id,
    service_name: record.services.map(s => s.title).join(', ') || 'Услуга',
    status: mapStatus(record),
    scheduled_at: record.datetime,
    duration_minutes: record.seance_length || 60,
    price: totalPrice,
    comment: record.comment || undefined,
    created_at: record.create_date,
    updated_at: record.last_change_date || record.create_date,
    client: client ? { name: client.name, phone: client.phone } : record.client ? { name: record.client.name, phone: record.client.phone } : undefined,
    staff: staff ? { name: staff.name } : undefined,
  };
}

/**
 * GET /api/v1/admin/appointments
 * Получить список записей из синхронизированных данных
 */
export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();
    const staff = getSyncedStaff();
    const clients = getSyncedClients();

    // Если данных нет - вернуть пустой массив с подсказкой
    if (records.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        skip: 0,
        limit: 20,
        message: 'Данные не синхронизированы. Запустите синхронизацию на странице /apps/sync',
      });
    }

    // Создать lookup maps для быстрого поиска
    const staffMap = new Map(staff.map(s => [s.id, { name: s.name }]));
    const clientsMap = new Map(clients.map(c => [c.id, { name: c.name, phone: c.phone }]));

    // Преобразовать все записи
    let appointments = records.map(r => transformRecord(r, staffMap, clientsMap));

    // Получить параметры запроса
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as AppointmentStatus | null;
    const staffId = searchParams.get('staff_id');
    const clientId = searchParams.get('client_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const date = searchParams.get('date'); // Фильтр по конкретной дате
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Применить фильтры
    if (status) {
      appointments = appointments.filter(a => a.status === status);
    }

    if (staffId) {
      appointments = appointments.filter(a => a.staff_id === parseInt(staffId, 10));
    }

    if (clientId) {
      appointments = appointments.filter(a => a.client_id === clientId);
    }

    if (date) {
      appointments = appointments.filter(a => a.scheduled_at.startsWith(date));
    } else {
      if (dateFrom) {
        appointments = appointments.filter(a => a.scheduled_at >= dateFrom);
      }
      if (dateTo) {
        appointments = appointments.filter(a => a.scheduled_at <= dateTo);
      }
    }

    // Сортировка по дате (новые сверху)
    appointments.sort((a, b) =>
      new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );

    // Общее количество после фильтрации
    const total = appointments.length;

    // Применить пагинацию
    const paginatedAppointments = appointments.slice(skip, skip + limit);

    const response: AppointmentsListResponse = {
      items: paginatedAppointments,
      total,
      skip,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting appointments:', error);
    return NextResponse.json(
      { error: 'Failed to get appointments' },
      { status: 500 }
    );
  }
}
