import { NextRequest, NextResponse } from 'next/server';
import { yclientsApi, YclientsRecord } from '@/lib/yclients';

/**
 * API для получения записей клиента по номеру телефона
 * GET /api/v1/public/client/records?phone=79001234567
 *
 * Используется в Telegram Mini App для отображения истории записей клиента.
 * CORS разрешён для Mini App.
 */

interface FormattedRecord {
  id: number;
  service: string;
  services: { id: number; title: string; cost: number }[];
  master: string;
  master_id: number;
  date: string;
  time: string;
  datetime: string;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  confirmed: boolean;
}

interface ClientRecordsResponse {
  success: boolean;
  data?: {
    client: {
      id: number;
      name: string;
      phone: string;
      visit_count: number;
      last_visit_date: string | null;
    } | null;
    upcoming: FormattedRecord[];
    past: FormattedRecord[];
  };
  error?: string;
}

// Нормализация телефона к формату 79XXXXXXXXX
function normalizePhone(phone: string): string {
  // Удаляем все нецифровые символы
  let digits = phone.replace(/\D/g, '');

  // Обработка различных форматов
  if (digits.startsWith('8') && digits.length === 11) {
    // 89001234567 -> 79001234567
    digits = '7' + digits.slice(1);
  } else if (digits.length === 10) {
    // 9001234567 -> 79001234567
    digits = '7' + digits;
  } else if (digits.startsWith('+')) {
    // Уже обработано выше через replace
  }

  return digits;
}

// Форматирование даты для отображения
function formatDate(datetime: string): string {
  const date = new Date(datetime);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) {
    return 'Сегодня';
  }
  if (isTomorrow) {
    return 'Завтра';
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

// Форматирование времени
function formatTime(datetime: string): string {
  const date = new Date(datetime);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Форматирование записи
function formatRecord(record: YclientsRecord, staffMap: Map<number, string>): FormattedRecord {
  const now = new Date();
  const recordDate = new Date(record.datetime);

  let status: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
  if (record.attendance === -1 || record.deleted) {
    status = 'cancelled';
  } else if (recordDate < now) {
    status = 'completed';
  }

  const services = record.services.map(s => ({
    id: s.id,
    title: s.title,
    cost: s.cost,
  }));

  const serviceName = services.map(s => s.title).join(', ') || 'Услуга';
  const totalPrice = services.reduce((sum, s) => sum + s.cost, 0);
  const masterName = staffMap.get(record.staff_id) || 'Мастер';

  return {
    id: record.id,
    service: serviceName,
    services,
    master: masterName,
    master_id: record.staff_id,
    date: formatDate(record.datetime),
    time: formatTime(record.datetime),
    datetime: record.datetime,
    price: totalPrice,
    status,
    confirmed: record.confirmed === 1,
  };
}

// CORS headers для Mini App
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      const response: ClientRecordsResponse = {
        success: false,
        error: 'Phone number is required',
      };
      return NextResponse.json(response, { status: 400, headers: corsHeaders() });
    }

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 10 || normalizedPhone.length > 12) {
      const response: ClientRecordsResponse = {
        success: false,
        error: 'Invalid phone number format',
      };
      return NextResponse.json(response, { status: 400, headers: corsHeaders() });
    }

    // Поиск клиента по телефону
    const clients = await yclientsApi.getClients({ phone: normalizedPhone });

    if (!clients || clients.length === 0) {
      // Клиент не найден - это нормально, просто нет записей
      const response: ClientRecordsResponse = {
        success: true,
        data: {
          client: null,
          upcoming: [],
          past: [],
        },
      };
      return NextResponse.json(response, { headers: corsHeaders() });
    }

    const client = clients[0];

    // Получаем сотрудников для маппинга имён
    const staff = await yclientsApi.getStaff();
    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    // Получаем записи клиента за последний год и на год вперёд
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const records = await yclientsApi.getRecords({
      client_id: client.id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    // Форматируем и разделяем на предстоящие и прошедшие
    const formattedRecords = records
      .filter(r => !r.deleted)
      .map(r => formatRecord(r, staffMap));

    const upcoming = formattedRecords
      .filter(r => r.status === 'upcoming')
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    const past = formattedRecords
      .filter(r => r.status === 'completed' || r.status === 'cancelled')
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    const response: ClientRecordsResponse = {
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          phone: client.phone,
          visit_count: client.visit_count,
          last_visit_date: client.last_visit_date,
        },
        upcoming,
        past,
      },
    };

    return NextResponse.json(response, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching client records:', error);
    const response: ClientRecordsResponse = {
      success: false,
      error: 'Failed to fetch records',
    };
    return NextResponse.json(response, { status: 500, headers: corsHeaders() });
  }
}
