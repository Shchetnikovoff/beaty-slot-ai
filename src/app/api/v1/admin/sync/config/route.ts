import { NextResponse } from 'next/server';
import { getSyncConfig, updateSyncConfig } from '@/lib/sync-store';

/**
 * GET /api/v1/admin/sync/config
 * Получить конфигурацию синхронизации
 */
export async function GET() {
  try {
    const config = getSyncConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error getting sync config:', error);
    return NextResponse.json(
      { error: 'Failed to get sync config' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/admin/sync/config
 * Обновить конфигурацию синхронизации
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const updatedConfig = updateSyncConfig({
      auto_sync_enabled: body.auto_sync_enabled,
      sync_interval_hours: body.sync_interval_hours,
      min_visits_threshold: body.min_visits_threshold,
      realtime_enabled: body.realtime_enabled,
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating sync config:', error);
    return NextResponse.json(
      { error: 'Failed to update sync config' },
      { status: 500 }
    );
  }
}
