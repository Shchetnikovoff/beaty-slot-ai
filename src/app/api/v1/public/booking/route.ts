import { NextRequest, NextResponse } from 'next/server';
import { yclientsApi } from '@/lib/yclients';
import { getSyncedServices, getSyncedStaff } from '@/lib/sync-store';

/**
 * API для создания записи в YClients
 * POST /api/v1/public/booking
 *
 * Body:
 * - service_id: ID услуги
 * - staff_id: ID мастера
 * - datetime: дата и время записи (ISO format)
 * - client_name: имя клиента
 * - client_phone: телефон клиента
 * - client_email?: email клиента (опционально)
 * - comment?: комментарий (опционально)
 * - telegram_user_id?: ID пользователя Telegram (опционально)
 */

interface BookingRequest {
  service_id: number;
  staff_id: number;
  datetime: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  comment?: string;
  telegram_user_id?: number;
}

interface BookingResponse {
  id: number;
  service: {
    id: number;
    name: string;
  };
  staff: {
    id: number;
    name: string;
  };
  datetime: string;
  status: 'confirmed' | 'pending';
  yclients_record_id: number;
}

// Нормализация телефона в формат 79XXXXXXXXX
function normalizePhone(phone: string): string {
  // Убираем всё кроме цифр
  const digits = phone.replace(/\D/g, '');

  // Если начинается с 8, меняем на 7
  if (digits.startsWith('8') && digits.length === 11) {
    return '7' + digits.slice(1);
  }

  // Если 10 цифр без кода страны, добавляем 7
  if (digits.length === 10) {
    return '7' + digits;
  }

  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json();

    // Валидация обязательных полей
    if (!body.service_id || !body.staff_id || !body.datetime || !body.client_name || !body.client_phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: service_id, staff_id, datetime, client_name, client_phone',
        },
        { status: 400 }
      );
    }

    // Валидация телефона
    const normalizedPhone = normalizePhone(body.client_phone);
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Получаем данные услуги и мастера из кэша ДО создания записи
    const services = getSyncedServices();
    const staff = getSyncedStaff();

    const service = services.find((s) => s.id === body.service_id);
    const master = staff.find((s) => s.id === body.staff_id);

    // Получаем длительность услуги в секундах (seance_length)
    // YClients требует это поле для создания записи
    const seanceLength = service?.seance_length || 3600; // Default 1 hour if not found

    // Логируем для отладки (без полного телефона)
    console.log('[Booking] Creating record:', {
      service_id: body.service_id,
      staff_id: body.staff_id,
      datetime: body.datetime,
      client_name: body.client_name,
      client_phone: normalizedPhone.slice(0, 4) + '****' + normalizedPhone.slice(-2),
      telegram_user_id: body.telegram_user_id,
      seance_length: seanceLength,
    });

    // Создаём запись в YClients
    const yclientsRecord = await yclientsApi.createRecord({
      staff_id: body.staff_id,
      services: [{ id: body.service_id }],
      client: {
        phone: normalizedPhone,
        name: body.client_name,
        email: body.client_email,
      },
      datetime: body.datetime,
      seance_length: seanceLength,
      comment: body.comment
        ? `${body.comment}${body.telegram_user_id ? ` [TG:${body.telegram_user_id}]` : ''}`
        : body.telegram_user_id
        ? `[TG:${body.telegram_user_id}]`
        : undefined,
    });

    const response: BookingResponse = {
      id: yclientsRecord.id,
      service: {
        id: body.service_id,
        name: service?.title || yclientsRecord.services?.[0]?.title || 'Услуга',
      },
      staff: {
        id: body.staff_id,
        name: master?.name || 'Мастер',
      },
      datetime: body.datetime,
      status: yclientsRecord.confirmed ? 'confirmed' : 'pending',
      yclients_record_id: yclientsRecord.id,
    };

    console.log('[Booking] Record created successfully:', {
      yclients_id: yclientsRecord.id,
      service: response.service.name,
      staff: response.staff.name,
      datetime: response.datetime,
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Запись успешно создана!',
    });
  } catch (error) {
    console.error('[Booking] Error creating booking:', error);

    // Обработка специфичных ошибок YClients
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('busy') || errorMessage.includes('занят')) {
      return NextResponse.json(
        { success: false, error: 'Выбранное время уже занято. Пожалуйста, выберите другое время.' },
        { status: 409 }
      );
    }

    if (errorMessage.includes('401') || errorMessage.includes('auth')) {
      return NextResponse.json(
        { success: false, error: 'Ошибка авторизации. Обратитесь в салон.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Не удалось создать запись. Попробуйте позже.' },
      { status: 500 }
    );
  }
}

// CORS headers for Mini App
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Telegram-Init-Data',
    },
  });
}
