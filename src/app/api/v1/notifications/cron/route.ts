import { NextResponse } from 'next/server';
import { telegramBot } from '@/lib/telegram-bot';
import { getTelegramLinkByPhone, normalizePhone } from '@/lib/telegram-store';
import { getSyncedRecords, getSyncedServices, getSyncedStaff, getSyncedClients } from '@/lib/sync-store';
import {
  getNotificationSettingByType,
  substituteVariables,
  markNotificationAsSent,
  wasNotificationSent,
  cleanupSentNotifications,
  type NotificationType,
  type NotificationVariables,
} from '@/lib/notification-settings-store';

interface CronResult {
  ok: boolean;
  timestamp: string;
  results: {
    reminderDay: { sent: number; skipped: number; failed: number };
    reminderHour: { sent: number; skipped: number; failed: number };
    postVisit: { sent: number; skipped: number; failed: number };
  };
  cleaned: number;
  errors: string[];
}

/**
 * GET /api/v1/notifications/cron
 * Триггер для автоматической отправки уведомлений
 * Вызывается каждую минуту через Vercel Cron или внешний сервис
 */
export async function GET() {
  const result: CronResult = {
    ok: true,
    timestamp: new Date().toISOString(),
    results: {
      reminderDay: { sent: 0, skipped: 0, failed: 0 },
      reminderHour: { sent: 0, skipped: 0, failed: 0 },
      postVisit: { sent: 0, skipped: 0, failed: 0 },
    },
    cleaned: 0,
    errors: [],
  };

  try {
    // Проверяем что бот настроен
    if (!telegramBot.isConfigured()) {
      console.log('[Cron] Telegram bot not configured, skipping');
      return NextResponse.json({
        ...result,
        ok: false,
        errors: ['Telegram bot not configured'],
      });
    }

    const now = new Date();
    const records = getSyncedRecords();
    const services = getSyncedServices();
    const staff = getSyncedStaff();
    const clients = getSyncedClients();

    // Создаём карты для быстрого поиска
    const serviceMap = new Map(services.map(s => [s.id, s]));
    const staffMap = new Map(staff.map(s => [s.id, s]));
    const clientMap = new Map(clients.map(c => [c.id, c]));

    // 1. Напоминание за день (отправляем в 10:00)
    if (now.getHours() === 10 && now.getMinutes() < 5) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const tomorrowRecords = records.filter(r =>
        r.date === tomorrowStr &&
        !r.deleted &&
        r.attendance !== -1 &&
        r.client?.id
      );

      console.log(`[Cron] Found ${tomorrowRecords.length} records for tomorrow (${tomorrowStr})`);

      for (const record of tomorrowRecords) {
        const sendResult = await sendNotification(
          record,
          'booking_reminder_day',
          record.date,
          { serviceMap, staffMap, clientMap }
        );

        if (sendResult === 'sent') {
          result.results.reminderDay.sent++;
        } else if (sendResult === 'skipped') {
          result.results.reminderDay.skipped++;
        } else {
          result.results.reminderDay.failed++;
        }
      }
    }

    // 2. Напоминание за час
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];
    const targetHour = inOneHour.getHours().toString().padStart(2, '0');
    const targetMinute = inOneHour.getMinutes();

    // Найти записи которые начинаются через ~1 час (±5 минут)
    const soonRecords = records.filter(r => {
      if (r.date !== todayStr || r.deleted || r.attendance === -1 || !r.client?.id) {
        return false;
      }

      // Парсим время записи (формат "HH:MM" или "HH:MM:SS")
      const [hours, minutes] = (r.datetime?.split(' ')[1] || '00:00').split(':').map(Number);

      // Проверяем что запись через ~1 час
      const recordMinutes = hours * 60 + minutes;
      const targetMinutes = parseInt(targetHour) * 60 + targetMinute;
      const diff = Math.abs(recordMinutes - targetMinutes);

      return diff <= 5; // ±5 минут
    });

    console.log(`[Cron] Found ${soonRecords.length} records starting in ~1 hour`);

    for (const record of soonRecords) {
      const sendResult = await sendNotification(
        record,
        'booking_reminder_hour',
        `${record.date}:${record.datetime?.split(' ')[1] || ''}`,
        { serviceMap, staffMap, clientMap }
      );

      if (sendResult === 'sent') {
        result.results.reminderHour.sent++;
      } else if (sendResult === 'skipped') {
        result.results.reminderHour.skipped++;
      } else {
        result.results.reminderHour.failed++;
      }
    }

    // 3. Уведомление после визита (через 2 часа после окончания)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAgoStr = twoHoursAgo.toISOString().split('T')[0];
    const checkHour = twoHoursAgo.getHours().toString().padStart(2, '0');

    const completedRecords = records.filter(r => {
      if (r.date !== twoHoursAgoStr || r.deleted || !r.client?.id) {
        return false;
      }

      // Только завершённые визиты (attendance === 1)
      if (r.attendance !== 1) {
        return false;
      }

      // Парсим время окончания
      const endTime = r.datetime?.split(' ')[1] || '00:00';
      const [hours] = endTime.split(':').map(Number);

      // Проверяем что визит закончился ~2 часа назад
      return hours === parseInt(checkHour);
    });

    console.log(`[Cron] Found ${completedRecords.length} completed records from ~2 hours ago`);

    for (const record of completedRecords) {
      const sendResult = await sendNotification(
        record,
        'post_visit',
        `${record.date}:post`,
        { serviceMap, staffMap, clientMap }
      );

      if (sendResult === 'sent') {
        result.results.postVisit.sent++;
      } else if (sendResult === 'skipped') {
        result.results.postVisit.skipped++;
      } else {
        result.results.postVisit.failed++;
      }
    }

    // Очистка старых записей
    result.cleaned = cleanupSentNotifications();

    const totalSent =
      result.results.reminderDay.sent +
      result.results.reminderHour.sent +
      result.results.postVisit.sent;

    console.log(`[Cron] Completed. Total sent: ${totalSent}, Cleaned: ${result.cleaned}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cron] Error:', error);
    result.ok = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(result, { status: 500 });
  }
}

/**
 * Отправить уведомление клиенту
 */
async function sendNotification(
  record: {
    id: number;
    date: string;
    datetime?: string;
    client?: { id: number; name: string; phone: string } | null;
    staff_id?: number;
    services?: { id: number; title: string }[];
  },
  type: NotificationType,
  dedupeKey: string,
  maps: {
    serviceMap: Map<number, { id: number; title: string }>;
    staffMap: Map<number, { id: number; name: string }>;
    clientMap: Map<number, { id: number; name: string; phone: string }>;
  }
): Promise<'sent' | 'skipped' | 'failed'> {
  try {
    // Проверяем что уведомление ещё не отправлялось
    if (wasNotificationSent(record.id, type, dedupeKey)) {
      return 'skipped';
    }

    // Получаем шаблон
    const template = getNotificationSettingByType(type);
    if (!template || !template.isActive) {
      return 'skipped';
    }

    // Получаем данные клиента
    if (!record.client?.phone) {
      return 'skipped';
    }
    const client = record.client;

    // Проверяем что клиент связан с Telegram
    const normalizedPhone = normalizePhone(client.phone);
    const telegramLink = getTelegramLinkByPhone(normalizedPhone);
    if (!telegramLink) {
      return 'skipped';
    }

    // Собираем данные для подстановки
    const staffMember = record.staff_id ? maps.staffMap.get(record.staff_id) : null;
    const serviceName = record.services?.[0]?.title || 'услугу';

    // Форматируем дату и время
    const dateObj = new Date(record.date);
    const visitDate = dateObj.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const visitTime = record.datetime?.split(' ')[1]?.slice(0, 5) || '';

    const variables: NotificationVariables = {
      client_name: client.name || 'Уважаемый клиент',
      client_phone: client.phone,
      service_name: serviceName,
      staff_name: staffMember?.name || 'мастера',
      visit_date: visitDate,
      visit_time: visitTime,
      salon_name: 'Beauty Slot',
    };

    // Подставляем переменные
    const message = substituteVariables(template.message, variables);

    // Отправляем через Telegram
    const success = await telegramBot.sendMessage(telegramLink.telegramId, message);

    if (success) {
      // Отмечаем как отправленное
      markNotificationAsSent(record.id, type, dedupeKey);
      console.log(`[Cron] Sent ${type} to client ${client.name} (record ${record.id})`);
      return 'sent';
    } else {
      console.error(`[Cron] Failed to send ${type} to client ${client.name}`);
      return 'failed';
    }
  } catch (error) {
    console.error(`[Cron] Error sending ${type} for record ${record.id}:`, error);
    return 'failed';
  }
}
