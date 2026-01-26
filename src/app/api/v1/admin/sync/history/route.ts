import { NextResponse } from 'next/server';
import { getSyncHistory } from '@/lib/sync-store';

/**
 * GET /api/v1/admin/sync/history
 * Получить историю синхронизаций
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const history = getSyncHistory(limit);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error getting sync history:', error);
    return NextResponse.json(
      { error: 'Failed to get sync history' },
      { status: 500 }
    );
  }
}
