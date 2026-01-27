import { NextRequest, NextResponse } from 'next/server';
import {
  telegramBot,
  callbackButton,
  type TelegramUpdate,
  type TelegramUser,
} from '@/lib/telegram-bot';
import {
  linkTelegram,
  getTelegramLinkByTelegramId,
  normalizePhone,
} from '@/lib/telegram-store';
import { getSyncedClients, getSyncedRecords, getSyncedServices, getSyncedStaff } from '@/lib/sync-store';

// Состояния диалога для каждого пользователя
const userStates = new Map<number, { state: string; data?: Record<string, unknown> }>();

/**
 * POST /api/v1/telegram/webhook
 * Обработка входящих сообщений от Telegram
 */
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    console.log('[Telegram Webhook] Received update:', JSON.stringify(update, null, 2));

    // Обработка callback query (нажатие inline-кнопки)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Обработка сообщения
    if (update.message) {
      await handleMessage(update.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ ok: true }); // Всегда возвращаем 200 для Telegram
  }
}

/**
 * Обработка текстовых сообщений
 */
async function handleMessage(message: TelegramUpdate['message']) {
  if (!message || !message.chat) return;

  const chatId = message.chat.id;
  const text = message.text?.trim() || '';
  const userId = message.from?.id;

  // Обработка контакта (номер телефона)
  if (message.contact) {
    await handleContact(chatId, message.contact, message.from);
    return;
  }

  // Проверяем состояние пользователя
  const userState = userId ? userStates.get(userId) : null;

  if (userState?.state === 'awaiting_phone') {
    await handlePhoneInput(chatId, text, message.from);
    return;
  }

  // Обработка команд
  if (text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();

    switch (command) {
      case '/start':
        await handleStart(chatId, message.from);
        break;
      case '/menu':
        await sendMainMenu(chatId);
        break;
      case '/book':
        await handleBook(chatId);
        break;
      case '/history':
        await handleHistory(chatId);
        break;
      case '/upcoming':
        await handleUpcoming(chatId);
        break;
      case '/cancel':
        await handleCancelBooking(chatId);
        break;
      case '/help':
        await sendHelp(chatId);
        break;
      default:
        await telegramBot.sendMessage(
          chatId,
          'Неизвестная команда. Используйте /menu для просмотра доступных действий.'
        );
    }
    return;
  }

  // Если пользователь не авторизован, просим авторизоваться
  const link = getTelegramLinkByTelegramId(chatId);
  if (!link) {
    await handleStart(chatId, message.from);
    return;
  }

  // Иначе показываем меню
  await sendMainMenu(chatId);
}

/**
 * Обработка команды /start
 */
async function handleStart(
  chatId: number,
  from?: TelegramUser
) {
  const link = getTelegramLinkByTelegramId(chatId);

  if (link) {
    // Уже авторизован
    const clients = getSyncedClients();
    const client = clients.find(
      (c) => normalizePhone(c.phone) === link.phone
    );

    await telegramBot.sendMessage(
      chatId,
      `👋 С возвращением, ${client?.name || 'дорогой клиент'}!\n\nВыберите действие:`,
      {
        reply_markup: {
          inline_keyboard: [
            [callbackButton('📝 Записаться', 'action:book')],
            [callbackButton('📋 Мои записи', 'action:upcoming')],
            [callbackButton('📖 История визитов', 'action:history')],
            [callbackButton('ℹ️ О салоне', 'action:about')],
          ],
        },
      }
    );
    return;
  }

  // Новый пользователь - просим номер телефона
  if (from?.id) {
    userStates.set(from.id, { state: 'awaiting_phone' });
  }

  await telegramBot.sendContactRequest(
    chatId,
    '👋 Добро пожаловать!\n\n' +
      'Для начала работы нам нужно вас авторизовать.\n\n' +
      '📱 Нажмите кнопку ниже, чтобы отправить номер телефона, ' +
      'или введите его вручную в формате: +7XXXXXXXXXX'
  );
}

/**
 * Обработка отправки контакта
 */
async function handleContact(
  chatId: number,
  contact: { phone_number: string; first_name: string; last_name?: string; user_id?: number },
  from?: TelegramUser
) {
  const phone = normalizePhone(contact.phone_number);
  await authorizeByPhone(chatId, phone, from);
}

/**
 * Обработка ввода телефона текстом
 */
async function handlePhoneInput(
  chatId: number,
  text: string,
  from?: TelegramUser
) {
  const phone = normalizePhone(text);

  // Проверяем что это похоже на телефон
  if (phone.length < 10 || phone.length > 12) {
    await telegramBot.sendMessage(
      chatId,
      '❌ Неверный формат номера телефона.\n\nВведите номер в формате: +7XXXXXXXXXX'
    );
    return;
  }

  await authorizeByPhone(chatId, phone, from);
}

/**
 * Авторизация по номеру телефона
 */
async function authorizeByPhone(
  chatId: number,
  phone: string,
  from?: TelegramUser
) {
  // Ищем клиента по телефону
  const clients = getSyncedClients();
  const client = clients.find(
    (c) => normalizePhone(c.phone) === phone
  );

  if (!client) {
    await telegramBot.removeKeyboard(
      chatId,
      '❌ К сожалению, мы не нашли вас в нашей базе клиентов.\n\n' +
        'Возможно, вы ещё не были у нас или указали другой номер при записи.\n\n' +
        'Попробуйте ввести другой номер или посетите наш салон.'
    );

    if (from?.id) {
      userStates.set(from.id, { state: 'awaiting_phone' });
    }
    return;
  }

  // Создаём связку
  linkTelegram(phone, chatId, client.id, {
    firstName: from?.first_name,
    lastName: from?.last_name,
    username: from?.username,
  });

  if (from?.id) {
    userStates.delete(from.id);
  }

  await telegramBot.removeKeyboard(
    chatId,
    `✅ Отлично, ${client.name}! Вы успешно авторизованы.\n\n` +
      'Теперь вы можете:\n' +
      '• Записываться на услуги\n' +
      '• Просматривать историю визитов\n' +
      '• Получать напоминания о записях\n' +
      '• Получать специальные предложения'
  );

  await sendMainMenu(chatId);
}

/**
 * Отправить главное меню
 */
async function sendMainMenu(chatId: number) {
  await telegramBot.sendMessageWithButtons(
    chatId,
    '📋 Главное меню\n\nВыберите действие:',
    [
      [callbackButton('📝 Записаться', 'action:book')],
      [callbackButton('📋 Мои записи', 'action:upcoming')],
      [callbackButton('📖 История визитов', 'action:history')],
      [callbackButton('ℹ️ О салоне', 'action:about')],
    ]
  );
}

/**
 * Обработка команды записи
 */
async function handleBook(chatId: number) {
  const link = getTelegramLinkByTelegramId(chatId);

  if (!link) {
    await handleStart(chatId);
    return;
  }

  // Получаем услуги
  const services = getSyncedServices();

  if (services.length === 0) {
    await telegramBot.sendMessage(
      chatId,
      '😔 К сожалению, услуги временно недоступны.\n\nПопробуйте позже или позвоните нам.'
    );
    return;
  }

  // Показываем первые 8 услуг напрямую
  const serviceButtons = services
    .filter((s) => s.active === 1)
    .slice(0, 8)
    .map((s) => [
      callbackButton(
        `${s.title.slice(0, 25)}${s.title.length > 25 ? '...' : ''} - ${s.price_min}₽`,
        `service:${s.id}`
      ),
    ]);

  serviceButtons.push([callbackButton('◀️ Назад', 'action:menu')]);

  await telegramBot.sendMessageWithButtons(
    chatId,
    '📝 Выберите услугу:',
    serviceButtons
  );
}

/**
 * Обработка истории визитов
 */
async function handleHistory(chatId: number) {
  const link = getTelegramLinkByTelegramId(chatId);

  if (!link) {
    await handleStart(chatId);
    return;
  }

  // Получаем записи клиента
  const records = getSyncedRecords();
  const staff = getSyncedStaff();
  const services = getSyncedServices();

  const clientRecords = records
    .filter(
      (r) =>
        r.client?.id === link.clientId &&
        !r.deleted &&
        new Date(r.date) < new Date()
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (clientRecords.length === 0) {
    await telegramBot.sendMessageWithButtons(
      chatId,
      '📖 У вас пока нет истории визитов.',
      [[callbackButton('📝 Записаться', 'action:book')], [callbackButton('◀️ Назад', 'action:menu')]]
    );
    return;
  }

  const staffMap = new Map(staff.map((s) => [s.id, s]));
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  let message = '📖 Ваши последние визиты:\n\n';

  for (const record of clientRecords) {
    const staffMember = staffMap.get(record.staff_id);
    const serviceIds = record.services?.map((s) => s.id) || [];
    const serviceNames = serviceIds
      .map((id) => serviceMap.get(id)?.title)
      .filter(Boolean)
      .join(', ') || 'Услуга';

    message += `📅 ${record.date}\n`;
    message += `   ${serviceNames}\n`;
    if (staffMember) {
      message += `   👤 ${staffMember.name}\n`;
    }
    message += '\n';
  }

  await telegramBot.sendMessageWithButtons(
    chatId,
    message,
    [[callbackButton('📝 Записаться снова', 'action:book')], [callbackButton('◀️ Назад', 'action:menu')]]
  );
}

/**
 * Обработка предстоящих записей
 */
async function handleUpcoming(chatId: number) {
  const link = getTelegramLinkByTelegramId(chatId);

  if (!link) {
    await handleStart(chatId);
    return;
  }

  const records = getSyncedRecords();
  const staff = getSyncedStaff();
  const services = getSyncedServices();

  const today = new Date().toISOString().split('T')[0];

  const upcomingRecords = records
    .filter(
      (r) =>
        r.client?.id === link.clientId &&
        !r.deleted &&
        r.date >= today &&
        r.attendance !== -1
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (upcomingRecords.length === 0) {
    await telegramBot.sendMessageWithButtons(
      chatId,
      '📋 У вас нет предстоящих записей.',
      [[callbackButton('📝 Записаться', 'action:book')], [callbackButton('◀️ Назад', 'action:menu')]]
    );
    return;
  }

  const staffMap = new Map(staff.map((s) => [s.id, s]));
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  let message = '📋 Ваши предстоящие записи:\n\n';

  for (const record of upcomingRecords) {
    const staffMember = staffMap.get(record.staff_id);
    const serviceIds = record.services?.map((s) => s.id) || [];
    const serviceNames = serviceIds
      .map((id) => serviceMap.get(id)?.title)
      .filter(Boolean)
      .join(', ') || 'Услуга';

    message += `📅 ${record.date} в ${record.datetime?.split(' ')[1] || '—'}\n`;
    message += `   ${serviceNames}\n`;
    if (staffMember) {
      message += `   👤 ${staffMember.name}\n`;
    }
    message += '\n';
  }

  await telegramBot.sendMessageWithButtons(
    chatId,
    message,
    [
      [callbackButton('❌ Отменить запись', 'action:cancel')],
      [callbackButton('◀️ Назад', 'action:menu')],
    ]
  );
}

/**
 * Обработка отмены записи
 */
async function handleCancelBooking(chatId: number) {
  await telegramBot.sendMessageWithButtons(
    chatId,
    '❌ Для отмены записи, пожалуйста, свяжитесь с администратором салона.\n\n' +
      'Мы работаем над возможностью отмены через бота.',
    [[callbackButton('◀️ Назад', 'action:menu')]]
  );
}

/**
 * Отправить справку
 */
async function sendHelp(chatId: number) {
  await telegramBot.sendMessage(
    chatId,
    '📚 Доступные команды:\n\n' +
      '/menu - Главное меню\n' +
      '/book - Записаться на услугу\n' +
      '/upcoming - Мои предстоящие записи\n' +
      '/history - История визитов\n' +
      '/cancel - Отменить запись\n' +
      '/help - Эта справка'
  );
}

/**
 * Обработка callback query (нажатие inline-кнопки)
 */
async function handleCallbackQuery(query: TelegramUpdate['callback_query']) {
  if (!query || !query.message) return;

  const chatId = query.message.chat.id;
  const data = query.data || '';

  // Подтверждаем получение callback
  await telegramBot.answerCallbackQuery(query.id);

  // Парсим действие
  const [action, value] = data.split(':');

  switch (action) {
    case 'action':
      switch (value) {
        case 'menu':
          await sendMainMenu(chatId);
          break;
        case 'book':
          await handleBook(chatId);
          break;
        case 'history':
          await handleHistory(chatId);
          break;
        case 'upcoming':
          await handleUpcoming(chatId);
          break;
        case 'cancel':
          await handleCancelBooking(chatId);
          break;
        case 'about':
          await telegramBot.sendMessageWithButtons(
            chatId,
            'ℹ️ О нашем салоне\n\n' +
              '💇 Мы предлагаем широкий спектр услуг для вашей красоты\n\n' +
              '📍 Адрес и контакты уточняйте у администратора\n\n' +
              '🕐 Работаем для вас каждый день!',
            [[callbackButton('📝 Записаться', 'action:book')], [callbackButton('◀️ Назад', 'action:menu')]]
          );
          break;
      }
      break;

    case 'service':
      // Показать мастеров для услуги
      const serviceId = parseInt(value, 10);
      const staff = getSyncedStaff();
      const activeStaff = staff.filter((s) => s.status === 1 && !s.fired);

      if (activeStaff.length === 0) {
        await telegramBot.sendMessageWithButtons(
          chatId,
          '😔 К сожалению, мастера сейчас недоступны.',
          [[callbackButton('◀️ Назад', 'action:book')]]
        );
        return;
      }

      const staffButtons = activeStaff.slice(0, 8).map((s) => [
        callbackButton(
          `👤 ${s.name}`,
          `staff:${s.id}:${serviceId}`
        ),
      ]);

      staffButtons.push([callbackButton('◀️ Назад', 'action:book')]);

      await telegramBot.sendMessageWithButtons(
        chatId,
        '👤 Выберите мастера:',
        staffButtons
      );
      break;

    case 'staff':
      // Информация о записи
      const [staffId, svcId] = value.split(':').map(Number);
      const selectedStaff = getSyncedStaff().find((s) => s.id === staffId);
      const selectedService = getSyncedServices().find((s) => s.id === svcId);

      await telegramBot.sendMessageWithButtons(
        chatId,
        `📝 Для завершения записи:\n\n` +
          `👤 Мастер: ${selectedStaff?.name || 'Не выбран'}\n` +
          `💇 Услуга: ${selectedService?.title || 'Не выбрана'}\n` +
          `💰 Стоимость: от ${selectedService?.price_min || '—'}₽\n\n` +
          `⚠️ Для выбора даты и времени, пожалуйста, свяжитесь с администратором или запишитесь через сайт.\n\n` +
          `Мы работаем над полной онлайн-записью через бота!`,
        [[callbackButton('◀️ В меню', 'action:menu')]]
      );
      break;
  }
}
