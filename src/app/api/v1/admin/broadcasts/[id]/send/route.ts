import { NextRequest, NextResponse } from 'next/server';
import {
  getBroadcastById,
  updateBroadcast,
  getAllTelegramLinks,
  normalizePhone,
} from '@/lib/telegram-store';
import { getSyncedClients } from '@/lib/sync-store';
import { telegramBot, callbackButton } from '@/lib/telegram-bot';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/broadcasts/[id]/send
 * Отправить рассылку
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const broadcastId = parseInt(id, 10);

    if (isNaN(broadcastId)) {
      return NextResponse.json(
        { error: 'Invalid broadcast ID' },
        { status: 400 }
      );
    }

    const broadcast = getBroadcastById(broadcastId);

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Проверить что рассылка в статусе DRAFT
    if (broadcast.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot send broadcast with status ${broadcast.status}` },
        { status: 400 }
      );
    }

    // Проверить что бот настроен
    if (!telegramBot.isConfigured()) {
      return NextResponse.json(
        { error: 'Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN in .env' },
        { status: 500 }
      );
    }

    // Обновить статус на "отправляется"
    updateBroadcast(broadcastId, { status: 'SCHEDULED' });

    // Собрать список telegram_id для рассылки
    const telegramLinks = getAllTelegramLinks();
    const clients = getSyncedClients();
    const chatIds: number[] = [];

    if (broadcast.target_audience === 'ALL') {
      // Все связанные клиенты
      chatIds.push(...telegramLinks.map((l) => l.telegramId));
    } else if (broadcast.target_audience === 'CUSTOM' && broadcast.clientIds) {
      // Конкретные клиенты
      const clientPhones = new Map(
        clients.map((c) => [c.id, normalizePhone(c.phone)])
      );
      const phoneToTelegram = new Map(
        telegramLinks.map((l) => [l.phone, l.telegramId])
      );

      for (const clientId of broadcast.clientIds) {
        const phone = clientPhones.get(clientId);
        if (phone) {
          const telegramId = phoneToTelegram.get(phone);
          if (telegramId) {
            chatIds.push(telegramId);
          }
        }
      }
    } else if (broadcast.target_audience === 'SEGMENT' && broadcast.segmentId) {
      // По сегменту - пока отправляем всем связанным
      // TODO: Интегрировать с smart-segments API
      chatIds.push(...telegramLinks.map((l) => l.telegramId));
    }

    // Обновить количество получателей
    updateBroadcast(broadcastId, { recipients_count: chatIds.length });

    if (chatIds.length === 0) {
      updateBroadcast(broadcastId, {
        status: 'FAILED',
        sent_at: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'No recipients found with linked Telegram accounts' },
        { status: 400 }
      );
    }

    // Отправить рассылку
    const result = await telegramBot.sendBroadcast(
      chatIds,
      broadcast.message,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [callbackButton('📝 Записаться', 'action:book')],
          ],
        },
      }
    );

    // Обновить статистику рассылки
    const finalStatus = result.failed === chatIds.length ? 'FAILED' : 'SENT';

    updateBroadcast(broadcastId, {
      status: finalStatus,
      sent_count: result.sent,
      failed_count: result.failed,
      sent_at: new Date().toISOString(),
    });

    console.log(
      `[Broadcast #${broadcastId}] Sent: ${result.sent}, Failed: ${result.failed}`
    );

    if (result.errors.length > 0) {
      console.log(`[Broadcast #${broadcastId}] Errors:`, result.errors.slice(0, 5));
    }

    return NextResponse.json({
      success: true,
      broadcast_id: broadcastId,
      sent: result.sent,
      failed: result.failed,
      total: chatIds.length,
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);

    // Попробовать обновить статус на FAILED
    try {
      const { id } = await params;
      updateBroadcast(parseInt(id, 10), { status: 'FAILED' });
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    );
  }
}
