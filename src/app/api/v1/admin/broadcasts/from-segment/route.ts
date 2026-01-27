import { NextRequest, NextResponse } from 'next/server';
import {
  createBroadcast,
  updateBroadcast,
  getAllTelegramLinks,
  normalizePhone,
} from '@/lib/telegram-store';
import { getSyncedClients, getSyncedRecords } from '@/lib/sync-store';
import { telegramBot, callbackButton } from '@/lib/telegram-bot';

interface SegmentDefinition {
  id: string;
  name: string;
  filter: (client: { id: number; phone: string; visits_count?: number; last_visit_date?: string }) => boolean;
}

// Определения сегментов (синхронизированы с smart-segments API)
const SEGMENTS: SegmentDefinition[] = [
  {
    id: 'recoverable_7d',
    name: 'Можно вернуть (7+ дней)',
    filter: (client) => {
      if (!client.last_visit_date) return false;
      const daysSinceVisit = Math.floor(
        (Date.now() - new Date(client.last_visit_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceVisit >= 7 && daysSinceVisit < 30;
    },
  },
  {
    id: 'at_risk_30d',
    name: 'В зоне риска (30+ дней)',
    filter: (client) => {
      if (!client.last_visit_date) return false;
      const daysSinceVisit = Math.floor(
        (Date.now() - new Date(client.last_visit_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceVisit >= 30;
    },
  },
  {
    id: 'loyal',
    name: 'Лояльные (5+ визитов)',
    filter: (client) => (client.visits_count || 0) >= 5,
  },
  {
    id: 'new_clients',
    name: 'Новые клиенты (1 визит)',
    filter: (client) => (client.visits_count || 0) === 1,
  },
  {
    id: 'all_with_telegram',
    name: 'Все с Telegram',
    filter: () => true, // Фильтрация по telegram будет отдельно
  },
];

/**
 * POST /api/v1/admin/broadcasts/from-segment
 * Создать и отправить рассылку по сегменту
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segment_id, title, message, send_immediately } = body;

    if (!segment_id || !title || !message) {
      return NextResponse.json(
        { error: 'segment_id, title and message are required' },
        { status: 400 }
      );
    }

    const segment = SEGMENTS.find((s) => s.id === segment_id);
    if (!segment) {
      return NextResponse.json(
        { error: `Unknown segment: ${segment_id}` },
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

    // Получить клиентов и записи
    const clients = getSyncedClients();
    const records = getSyncedRecords();
    const telegramLinks = getAllTelegramLinks();

    // Построить Map телефон -> telegram_id
    const phoneToTelegram = new Map(
      telegramLinks.map((l) => [l.phone, l.telegramId])
    );

    // Подсчитать статистику клиентов
    const clientStats = new Map<number, { visits_count: number; last_visit_date: string | null }>();

    for (const record of records) {
      if (record.deleted || record.attendance === -1 || !record.client?.id) continue;

      const clientId = record.client.id;
      const current = clientStats.get(clientId) || { visits_count: 0, last_visit_date: null };
      current.visits_count++;

      if (!current.last_visit_date || record.date > current.last_visit_date) {
        current.last_visit_date = record.date;
      }

      clientStats.set(clientId, current);
    }

    // Фильтровать клиентов по сегменту И наличию telegram
    const targetChatIds: number[] = [];

    for (const client of clients) {
      const normalizedPhone = normalizePhone(client.phone);
      const telegramId = phoneToTelegram.get(normalizedPhone);

      if (!telegramId) continue; // Нет telegram - пропускаем

      const stats = clientStats.get(client.id) || { visits_count: 0, last_visit_date: null };

      const clientData = {
        id: client.id,
        phone: normalizedPhone,
        visits_count: stats.visits_count,
        last_visit_date: stats.last_visit_date || undefined,
      };

      if (segment.filter(clientData)) {
        targetChatIds.push(telegramId);
      }
    }

    // Создать рассылку
    const broadcast = createBroadcast({
      title,
      message,
      target_audience: 'SEGMENT',
      recipients_count: targetChatIds.length,
      segmentId: segment_id,
    });

    if (targetChatIds.length === 0) {
      updateBroadcast(broadcast.id, {
        status: 'FAILED',
        sent_at: new Date().toISOString(),
      });

      return NextResponse.json({
        broadcast,
        message: 'No recipients found in this segment with linked Telegram',
        sent: 0,
        failed: 0,
      });
    }

    // Если нужно отправить сразу
    if (send_immediately) {
      updateBroadcast(broadcast.id, { status: 'SCHEDULED' });

      const result = await telegramBot.sendBroadcast(
        targetChatIds,
        message,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [callbackButton('📝 Записаться', 'action:book')],
            ],
          },
        }
      );

      const finalStatus = result.failed === targetChatIds.length ? 'FAILED' : 'SENT';

      updateBroadcast(broadcast.id, {
        status: finalStatus,
        sent_count: result.sent,
        failed_count: result.failed,
        sent_at: new Date().toISOString(),
      });

      console.log(
        `[Broadcast #${broadcast.id}] Segment: ${segment_id}, Sent: ${result.sent}, Failed: ${result.failed}`
      );

      return NextResponse.json({
        broadcast: { ...broadcast, status: finalStatus, sent_count: result.sent, failed_count: result.failed },
        segment: segment.name,
        sent: result.sent,
        failed: result.failed,
        total: targetChatIds.length,
      });
    }

    // Вернуть созданную рассылку без отправки
    return NextResponse.json({
      broadcast,
      segment: segment.name,
      recipients: targetChatIds.length,
      message: 'Broadcast created. Use /send endpoint to send it.',
    });
  } catch (error) {
    console.error('Error creating segment broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to create segment broadcast' },
      { status: 500 }
    );
  }
}
