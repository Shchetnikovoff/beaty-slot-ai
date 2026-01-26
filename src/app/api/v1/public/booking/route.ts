import { NextRequest, NextResponse } from 'next/server';

/**
 * API для создания записи
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
  yclients_record_id?: number;
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

    // Валидация телефона (простая)
    const phoneRegex = /^[\d\s\+\-\(\)]{10,20}$/;
    if (!phoneRegex.test(body.client_phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // TODO: Интеграция с Yclients API для создания записи
    // const yclientsRecord = await yclientsApi.createRecord({
    //   staff_id: body.staff_id,
    //   services: [{ id: body.service_id }],
    //   client: {
    //     name: body.client_name,
    //     phone: body.client_phone,
    //     email: body.client_email,
    //   },
    //   datetime: body.datetime,
    //   comment: body.comment,
    // });

    // Пока возвращаем mock ответ
    // В production здесь будет реальная запись через Yclients API
    const mockBookingId = Date.now();

    const response: BookingResponse = {
      id: mockBookingId,
      service: {
        id: body.service_id,
        name: 'Услуга', // TODO: получить из Yclients
      },
      staff: {
        id: body.staff_id,
        name: 'Мастер', // TODO: получить из Yclients
      },
      datetime: body.datetime,
      status: 'pending', // Yclients обычно подтверждает через webhook
    };

    // Логируем для отладки
    console.log('Booking request:', {
      ...body,
      client_phone: body.client_phone.replace(/\d(?=\d{4})/g, '*'), // Маскируем телефон в логах
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Запись успешно создана. Ожидайте подтверждения от салона.',
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/public/booking/:id - получить статус записи
 * Этот endpoint в отдельном файле [id]/route.ts
 */
