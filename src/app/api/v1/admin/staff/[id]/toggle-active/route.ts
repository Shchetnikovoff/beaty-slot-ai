import { NextRequest, NextResponse } from 'next/server';
import { getSyncedStaff, setStaffActiveOverride } from '@/lib/sync-store';

/**
 * PUT /api/v1/admin/staff/[id]/toggle-active
 * Изменить статус активности сотрудника
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staffId = parseInt(id, 10);
    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean' },
        { status: 400 }
      );
    }

    // Найти сотрудника в синхронизированных данных
    const yclientsStaff = getSyncedStaff();
    const staff = yclientsStaff.find(s => s.id === staffId);

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Сохранить изменение статуса
    setStaffActiveOverride(staffId, is_active);

    // Вернуть обновленного сотрудника
    const updatedStaff = {
      id: staff.id,
      yclients_id: String(staff.id),
      name: staff.name || 'Без имени',
      phone: undefined,
      email: undefined,
      role: 'MASTER' as const,
      specialization: staff.specialization || undefined,
      photo_url: staff.avatar_big || staff.avatar || undefined,
      is_active,
      appointments_count: 0,
      rating: staff.rating || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error('Error toggling staff active status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle staff active status' },
      { status: 500 }
    );
  }
}
