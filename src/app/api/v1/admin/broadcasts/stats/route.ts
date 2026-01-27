import { NextResponse } from 'next/server';
import { getBroadcastsStats, getLinkedClientsCount } from '@/lib/telegram-store';

/**
 * GET /api/v1/admin/broadcasts/stats
 * Получить статистику рассылок
 */
export async function GET() {
  try {
    const stats = getBroadcastsStats();
    const linkedClients = getLinkedClientsCount();

    return NextResponse.json({
      ...stats,
      linkedClients,
    });
  } catch (error) {
    console.error('Error getting broadcasts stats:', error);
    return NextResponse.json(
      { error: 'Failed to get broadcasts stats' },
      { status: 500 }
    );
  }
}
