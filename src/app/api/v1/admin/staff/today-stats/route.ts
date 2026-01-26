import { NextResponse } from 'next/server';
import { getSyncedStaff, getSyncedRecords } from '@/lib/sync-store';
import type { StaffTodayStats } from '@/types/staff';

/**
 * GET /api/v1/admin/staff/today-stats
 * Получить статистику сотрудников на сегодня
 */
export async function GET() {
  try {
    const staff = getSyncedStaff();
    const records = getSyncedRecords();

    // Получить сегодняшнюю дату
    const today = new Date().toISOString().split('T')[0];

    // Найти записи на сегодня
    const todayRecords = records.filter(r => r.date === today);

    // Уникальные staff_id с записями на сегодня
    const activeStaffIds = new Set(todayRecords.map(r => r.staff_id));

    // Активные сотрудники (не уволены, не скрыты)
    const activeStaff = staff.filter(s => s.status === 1 && !s.fired && !s.hidden);

    const stats: StaffTodayStats = {
      total: staff.length,
      active_today: activeStaffIds.size,
      appointments_today: todayRecords.length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting staff today stats:', error);
    return NextResponse.json(
      { error: 'Failed to get staff today stats' },
      { status: 500 }
    );
  }
}
