import { NextResponse } from 'next/server';
import { getSyncedRecords } from '@/lib/sync-store';
import type { AppointmentsTodayStats } from '@/types/appointment';

/**
 * GET /api/v1/admin/appointments/today-stats
 * Получить статистику записей на сегодня
 */
export async function GET() {
  try {
    const records = getSyncedRecords();

    // Получить сегодняшнюю дату
    const today = new Date().toISOString().split('T')[0];

    // Найти записи на сегодня
    // r.date может быть в формате "2026-01-26 20:45:00", поэтому проверяем startsWith
    const todayRecords = records.filter(r => r.date.startsWith(today));

    const stats: AppointmentsTodayStats = {
      total: todayRecords.length,
      confirmed: todayRecords.filter(r => r.confirmed === 1 && !r.deleted).length,
      pending: todayRecords.filter(r => r.confirmed === 0 && r.attendance === 0 && !r.deleted).length,
      cancelled: todayRecords.filter(r => r.deleted).length,
      no_show: todayRecords.filter(r => r.attendance === -1).length,
      completed: todayRecords.filter(r => r.attendance === 1).length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting appointments today stats:', error);
    return NextResponse.json(
      { error: 'Failed to get appointments today stats' },
      { status: 500 }
    );
  }
}
