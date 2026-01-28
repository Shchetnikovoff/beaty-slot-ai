import { NextRequest, NextResponse } from 'next/server';
import { yclientsApi } from '@/lib/yclients';

/**
 * API для управления записью в YClients
 *
 * DELETE /api/v1/public/booking/[id] - отменить запись
 * PUT /api/v1/public/booking/[id] - перенести запись (изменить дату/время)
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE - Отменить запись
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const recordId = parseInt(id, 10);

    if (isNaN(recordId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID' },
        { status: 400 }
      );
    }

    console.log('[Booking] Cancelling record:', recordId);

    // Удаляем запись в YClients
    const deleted = await yclientsApi.deleteRecord(recordId);

    if (deleted) {
      console.log('[Booking] Record cancelled successfully:', recordId);
      return NextResponse.json({
        success: true,
        message: 'Запись успешно отменена',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Booking] Error cancelling record:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Не удалось отменить запись. Попробуйте позже.' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Перенести запись (изменить дату/время)
 *
 * Body:
 * - datetime: новая дата и время (ISO format)
 * - staff_id?: новый мастер (опционально)
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const recordId = parseInt(id, 10);

    if (isNaN(recordId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { datetime, staff_id } = body;

    if (!datetime && !staff_id) {
      return NextResponse.json(
        { success: false, error: 'At least datetime or staff_id must be provided' },
        { status: 400 }
      );
    }

    console.log('[Booking] Rescheduling record:', recordId, {
      datetime,
      staff_id,
    });

    // Обновляем запись в YClients
    const updatedRecord = await yclientsApi.updateRecord(recordId, {
      datetime,
      staff_id,
    });

    console.log('[Booking] Record rescheduled successfully:', recordId);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRecord.id,
        datetime: updatedRecord.datetime,
        staff_id: updatedRecord.staff_id,
      },
      message: 'Запись успешно перенесена',
    });
  } catch (error) {
    console.error('[Booking] Error rescheduling record:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    if (errorMessage.includes('busy') || errorMessage.includes('занят')) {
      return NextResponse.json(
        { success: false, error: 'Выбранное время уже занято. Пожалуйста, выберите другое время.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Не удалось перенести запись. Попробуйте позже.' },
      { status: 500 }
    );
  }
}

/**
 * GET - Получить информацию о записи
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const recordId = parseInt(id, 10);

    if (isNaN(recordId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID' },
        { status: 400 }
      );
    }

    // Получаем запись из YClients через getRecords с фильтром
    // Note: YClients API не имеет прямого GET для одной записи,
    // поэтому мы ищем по ID в общем списке
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 3);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);

    const records = await yclientsApi.getRecords({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    const record = records.find((r) => r.id === recordId);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        datetime: record.datetime,
        staff_id: record.staff_id,
        services: record.services,
        client: record.client,
        status: record.deleted
          ? 'cancelled'
          : record.attendance === 1
          ? 'completed'
          : record.confirmed
          ? 'confirmed'
          : 'pending',
      },
    });
  } catch (error) {
    console.error('[Booking] Error getting record:', error);
    return NextResponse.json(
      { success: false, error: 'Не удалось получить информацию о записи' },
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Telegram-Init-Data',
    },
  });
}
