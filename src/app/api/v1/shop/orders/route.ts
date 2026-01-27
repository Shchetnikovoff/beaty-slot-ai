import { NextRequest, NextResponse } from 'next/server';

import { telegramBot } from '@/lib/telegram-bot';
import { getTelegramLinkByPhone, normalizePhone } from '@/lib/telegram-store';
import {
  createShopOrder,
  getShopOrders,
  getShopOrdersStats,
} from '@/lib/shop-orders-store';
import type { CreateOrderRequest } from '@/types/shop';

/**
 * GET /api/v1/shop/orders
 * Получить список всех заказов (для админки)
 */
export async function GET() {
  try {
    const orders = getShopOrders();
    const stats = getShopOrdersStats();

    // Сортируем по дате создания (новые сверху)
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      items: sortedOrders,
      total: orders.length,
      stats,
    });
  } catch (error) {
    console.error('[Shop Orders] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/shop/orders
 * Создать новый заказ
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { items, customer } = body;

    // Валидация
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Корзина пуста' },
        { status: 400 }
      );
    }

    if (!customer || !customer.name || !customer.phone) {
      return NextResponse.json(
        { error: 'Заполните обязательные поля: имя и телефон' },
        { status: 400 }
      );
    }

    // Создаём заказ
    const order = createShopOrder({
      items,
      customer,
      notes: customer.notes,
    });

    console.log(`[Shop Orders] Created order ${order.orderNumber}:`, {
      customer: customer.name,
      phone: customer.phone,
      total: order.total,
      itemsCount: items.length,
    });

    // Отправляем уведомление администратору
    if (telegramBot.isConfigured()) {
      const adminMessage = formatAdminNotification(order);

      // Получаем chat_id из env или используем фолбек
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (adminChatId) {
        await telegramBot.sendMessage(adminChatId, adminMessage);
      }

      // Если клиент связан с Telegram, отправляем подтверждение
      const normalizedPhone = normalizePhone(customer.phone);
      const telegramLink = getTelegramLinkByPhone(normalizedPhone);

      if (telegramLink) {
        const clientMessage = formatClientNotification(order);
        await telegramBot.sendMessage(telegramLink.telegramId, clientMessage);
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('[Shop Orders] POST error:', error);
    return NextResponse.json(
      { error: 'Не удалось создать заказ' },
      { status: 500 }
    );
  }
}

/**
 * Форматирование уведомления для администратора
 */
function formatAdminNotification(order: ReturnType<typeof createShopOrder>): string {
  const itemsList = order.items
    .map((item) => `  • ${item.product.title} × ${item.quantity} = ${(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽`)
    .join('\n');

  return `🛒 *Новый заказ ${order.orderNumber}*

👤 *Клиент:* ${order.customer.name}
📞 *Телефон:* ${order.customer.phone}
${order.customer.email ? `📧 *Email:* ${order.customer.email}` : ''}
${order.customer.notes ? `💬 *Комментарий:* ${order.customer.notes}` : ''}

📦 *Состав заказа:*
${itemsList}

💰 *Итого:* ${order.total.toLocaleString('ru-RU')} ₽

🕐 *Создан:* ${new Date(order.createdAt).toLocaleString('ru-RU')}`;
}

/**
 * Форматирование уведомления для клиента
 */
function formatClientNotification(order: ReturnType<typeof createShopOrder>): string {
  const itemsList = order.items
    .map((item) => `• ${item.product.title} × ${item.quantity}`)
    .join('\n');

  return `✅ *Заказ ${order.orderNumber} принят!*

Спасибо за ваш заказ!

📦 *Состав:*
${itemsList}

💰 *Сумма:* ${order.total.toLocaleString('ru-RU')} ₽

Мы свяжемся с вами для подтверждения в ближайшее время.`;
}
