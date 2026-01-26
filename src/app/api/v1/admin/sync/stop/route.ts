import { NextResponse } from 'next/server';
import {
  getSyncStatus,
  setSyncRunning,
  updateSyncHistoryItem,
  getCurrentSyncId,
  setCurrentSyncId,
  updateSyncStatus,
} from '@/lib/sync-store';

/**
 * POST /api/v1/admin/sync/stop
 * Остановить синхронизацию
 */
export async function POST() {
  try {
    const currentStatus = getSyncStatus();

    if (!currentStatus.is_running) {
      return NextResponse.json(
        { message: 'Sync is not running' },
        { status: 200 }
      );
    }

    const syncId = getCurrentSyncId();
    if (syncId) {
      updateSyncHistoryItem(syncId, {
        finished_at: new Date().toISOString(),
        status: 'partial',
        error_message: 'Stopped by user',
      });
    }

    setSyncRunning(false);
    setCurrentSyncId(null);
    updateSyncStatus({
      is_running: false,
      errors: ['Sync stopped by user'],
    });

    return NextResponse.json({ message: 'Sync stopped' });
  } catch (error) {
    console.error('Error stopping sync:', error);
    return NextResponse.json(
      { error: 'Failed to stop sync' },
      { status: 500 }
    );
  }
}
