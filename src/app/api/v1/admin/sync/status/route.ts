import { NextResponse } from 'next/server';
import { getSyncStatus, getSyncedDataInfo } from '@/lib/sync-store';

/**
 * GET /api/v1/admin/sync/status
 * Получить текущий статус синхронизации
 */
export async function GET() {
  try {
    const status = getSyncStatus();
    const dataInfo = getSyncedDataInfo();
    return NextResponse.json({
      ...status,
      synced_data: dataInfo,
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
