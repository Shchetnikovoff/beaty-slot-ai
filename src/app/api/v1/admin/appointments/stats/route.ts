import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords } from '@/lib/sync-store';
import type { AppointmentsTodayStats } from '@/types/appointment';

/**
 * GET /api/v1/admin/appointments/stats
 * Получить статистику записей за указанную дату
 * Query params: date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();

    // Получить дату из параметров запроса (по умолчанию - сегодня)
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Найти записи на указанную дату
    // r.date может быть в формате "2026-01-26 20:45:00", поэтому проверяем startsWith
    const dateRecords = records.filter(r => r.date.startsWith(date));

    const stats: AppointmentsTodayStats = {
      total: dateRecords.length,
      confirmed: dateRecords.filter(r => r.confirmed === 1 && !r.deleted).length,
      pending: dateRecords.filter(r => r.confirmed === 0 && r.attendance === 0 && !r.deleted).length,
      cancelled: dateRecords.filter(r => r.deleted).length,
      no_show: dateRecords.filter(r => r.attendance === -1).length,
      completed: dateRecords.filter(r => r.attendance === 1).length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting appointments stats:', error);
    return NextResponse.json(
      { error: 'Failed to get appointments stats' },
      { status: 500 }
    );
  }
}
