import { NextRequest, NextResponse } from 'next/server';
import {
  getNotificationSettings,
  updateNotificationSetting,
  getSentNotificationsStats,
} from '@/lib/notification-settings-store';

/**
 * GET /api/v1/admin/notification-settings
 * Получить все настройки уведомлений
 */
export async function GET() {
  try {
    const settings = getNotificationSettings();
    const sentStats = getSentNotificationsStats();

    return NextResponse.json({
      items: settings,
      stats: sentStats,
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to get notification settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/admin/notification-settings
 * Обновить настройку уведомления
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, message, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification setting ID is required' },
        { status: 400 }
      );
    }

    const updates: { message?: string; isActive?: boolean } = {};
    if (typeof message === 'string') {
      updates.message = message;
    }
    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updated = updateNotificationSetting(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Notification setting not found' },
        { status: 404 }
      );
    }

    console.log(`[Notifications] Updated setting ${id}:`, updates);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating notification setting:', error);
    return NextResponse.json(
      { error: 'Failed to update notification setting' },
      { status: 500 }
    );
  }
}
