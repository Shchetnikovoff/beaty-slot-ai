import { NextResponse } from 'next/server';
import { getAllTelegramLinks, getLinkedClientsCount } from '@/lib/telegram-store';
import { getSyncedClients } from '@/lib/sync-store';

/**
 * GET /api/v1/telegram/links
 * Получить список связанных Telegram аккаунтов
 */
export async function GET() {
  try {
    const links = getAllTelegramLinks();
    const clients = getSyncedClients();

    // Создаём Map для быстрого поиска клиентов
    const clientMap = new Map(
      clients.map((c) => [c.id, c])
    );

    // Добавляем информацию о клиентах
    const enrichedLinks = links.map((link) => {
      const client = clientMap.get(link.clientId);
      return {
        ...link,
        clientName: client?.name || 'Неизвестный',
        clientPhone: client?.phone || link.phone,
      };
    });

    return NextResponse.json({
      items: enrichedLinks,
      total: getLinkedClientsCount(),
    });
  } catch (error) {
    console.error('Error getting telegram links:', error);
    return NextResponse.json(
      { error: 'Failed to get telegram links' },
      { status: 500 }
    );
  }
}
