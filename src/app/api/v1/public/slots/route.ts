import { NextRequest, NextResponse } from 'next/server';
import { yclientsApi } from '@/lib/yclients';

/**
 * Поиск свободных слотов для записи
 * GET /api/v1/public/slots
 *
 * Query params:
 * - service_id: ID услуги (обязательно)
 * - staff_id: ID мастера (опционально)
 * - date: дата в формате YYYY-MM-DD (обязательно)
 */

interface TimeSlot {
  time: string; // HH:MM
  datetime: string; // ISO datetime
  available: boolean;
}

interface SlotsResponse {
  date: string;
  staffId?: number;
  staffName?: string;
  slots: TimeSlot[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const staffId = searchParams.get('staff_id');
    const date = searchParams.get('date');

    // Валидация
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'service_id is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'date is required' },
        { status: 400 }
      );
    }

    // Валидация формата даты
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: 'date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Получаем записи на эту дату для определения занятых слотов
    const records = await yclientsApi.getRecords({
      start_date: date,
      end_date: date,
      staff_id: staffId ? parseInt(staffId, 10) : undefined,
    });

    // Генерируем слоты с 9:00 до 21:00 с шагом 30 минут
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 21;
    const stepMinutes = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += stepMinutes) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const datetime = `${date}T${timeStr}:00`;

        // Проверяем, занят ли слот
        const isOccupied = records.some(record => {
          const recordTime = record.datetime.split(' ')[1]?.substring(0, 5);
          return recordTime === timeStr;
        });

        // Проверяем, не в прошлом ли слот
        const slotDate = new Date(`${date}T${timeStr}:00`);
        const now = new Date();
        const isPast = slotDate < now;

        slots.push({
          time: timeStr,
          datetime,
          available: !isOccupied && !isPast,
        });
      }
    }

    const response: SlotsResponse = {
      date,
      staffId: staffId ? parseInt(staffId, 10) : undefined,
      slots,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error getting slots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get available slots' },
      { status: 500 }
    );
  }
}
