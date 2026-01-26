import { NextRequest, NextResponse } from 'next/server';
import { getSyncedStaff } from '@/lib/sync-store';

/**
 * Публичный API мастеров
 * GET /api/v1/public/staff
 *
 * Query params:
 * - service_id: фильтр по услуге (опционально)
 */

interface PublicStaff {
  id: number;
  name: string;
  specialization: string;
  avatar?: string;
  rating: number;
  reviewsCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');

    const yclientsStaff = getSyncedStaff();

    // Фильтровать только активных мастеров (bookable и не уволены)
    let staff: PublicStaff[] = yclientsStaff
      .filter(s => s.bookable && s.fired !== 1 && s.hidden !== 1)
      .map(s => ({
        id: s.id,
        name: s.name,
        specialization: s.specialization || s.position?.title || '',
        avatar: s.avatar || s.avatar_big || undefined,
        rating: s.rating || 0,
        reviewsCount: s.comments_count || 0,
      }));

    // TODO: Если передан service_id - фильтровать мастеров по услуге
    // Это требует дополнительного API call к Yclients для получения связи staff-services

    // Сортировка по рейтингу
    staff.sort((a, b) => b.rating - a.rating);

    return NextResponse.json({
      success: true,
      data: staff,
      total: staff.length,
    });
  } catch (error) {
    console.error('Error getting staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get staff' },
      { status: 500 }
    );
  }
}
