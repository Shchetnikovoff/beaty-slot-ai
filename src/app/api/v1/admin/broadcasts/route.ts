import { NextRequest, NextResponse } from 'next/server';
import {
  createBroadcast,
  getBroadcasts,
  getBroadcastsStats,
  getAllTelegramLinks,
} from '@/lib/telegram-store';
import { getSyncedClients } from '@/lib/sync-store';
import type { BroadcastStatus, BroadcastTargetAudience } from '@/types/broadcast';

/**
 * GET /api/v1/admin/broadcasts
 * Получить список рассылок
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') as BroadcastStatus | null;

    const { items, total } = getBroadcasts({
      skip,
      limit,
      status: status || undefined,
    });

    return NextResponse.json({
      items,
      total,
      skip,
      limit,
    });
  } catch (error) {
    console.error('Error getting broadcasts:', error);
    return NextResponse.json(
      { error: 'Failed to get broadcasts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/broadcasts
 * Создать новую рассылку
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      message,
      target_audience,
      scheduled_at,
      client_ids,
      segment_id,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Рассчитать количество получателей
    let recipientsCount = 0;
    const telegramLinks = getAllTelegramLinks();
    const linkedTelegramIds = new Set(telegramLinks.map((l) => l.telegramId));

    if (target_audience === 'ALL') {
      // Все клиенты с telegram_id
      recipientsCount = linkedTelegramIds.size;
    } else if (target_audience === 'CUSTOM' && client_ids?.length > 0) {
      // Конкретные клиенты (проверяем что у них есть telegram)
      const clients = getSyncedClients();
      const clientPhones = new Map(
        clients.map((c) => [c.id, c.phone])
      );

      for (const clientId of client_ids) {
        const phone = clientPhones.get(clientId);
        if (phone) {
          const link = telegramLinks.find(
            (l) => l.phone === phone.replace(/\D/g, '')
          );
          if (link) {
            recipientsCount++;
          }
        }
      }
    } else if (target_audience === 'SEGMENT' && segment_id) {
      // По сегменту - будет рассчитано при отправке
      // Пока ставим примерное значение
      recipientsCount = linkedTelegramIds.size;
    }

    const broadcast = createBroadcast({
      title,
      message,
      target_audience: target_audience as BroadcastTargetAudience || 'ALL',
      recipients_count: recipientsCount,
      scheduled_at,
      clientIds: client_ids,
      segmentId: segment_id,
    });

    return NextResponse.json(broadcast, { status: 201 });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to create broadcast' },
      { status: 500 }
    );
  }
}
