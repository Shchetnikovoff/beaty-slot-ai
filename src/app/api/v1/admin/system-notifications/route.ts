import { NextResponse } from 'next/server';
import {
  getSyncedRecords,
  getSyncedClients,
  getSyncedStaff,
  getSyncedDataInfo,
} from '@/lib/sync-store';
import type { NotificationDto, NotificationType } from '@/types/notification';

/**
 * GET /api/v1/admin/system-notifications
 * Генерирует системные уведомления на основе реальных данных из YClients
 */

// Получить дату в формате YYYY-MM-DD
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Рассчитать количество дней с даты
function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Склонение слов (записей, клиентов и т.д.)
function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  return many;
}

function generateNotifications(): NotificationDto[] {
  const notifications: NotificationDto[] = [];
  const records = getSyncedRecords();
  const clients = getSyncedClients();
  const staff = getSyncedStaff();
  const syncInfo = getSyncedDataInfo();
  const now = new Date();
  const today = getLocalDateString(now);

  // Создать карту сотрудников для быстрого поиска
  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  // ==========================================
  // 1. ЗАПИСИ НА СЕГОДНЯ (reminder)
  // ==========================================
  const todayRecords = records.filter((r) => r.date === today && !r.deleted);
  if (todayRecords.length > 0) {
    const pendingCount = todayRecords.filter((r) => r.attendance === 0).length;
    const confirmedCount = todayRecords.filter((r) => r.confirmed === 1).length;

    notifications.push({
      id: `today-records-${today}`,
      type: 'reminder',
      title: 'Записи на сегодня',
      message: `${todayRecords.length} ${pluralize(todayRecords.length, 'запись', 'записи', 'записей')} на сегодня${
        confirmedCount > 0 ? `, ${confirmedCount} подтверждено` : ''
      }${pendingCount > 0 ? `, ${pendingCount} ожидает` : ''}`,
      timestamp: new Date(now.setHours(8, 0, 0, 0)).toISOString(),
      read: false,
      metadata: {
        workspace: 'Расписание',
        pageIcon: '📅',
      },
      action: {
        label: 'Открыть расписание',
        url: '/apps/appointments',
        type: 'primary',
      },
    });
  }

  // ==========================================
  // 2. НОВЫЕ ЗАПИСИ ЗА ПОСЛЕДНИЕ 24 ЧАСА
  // ==========================================
  const recentRecords = records.filter((r) => {
    if (!r.create_date || r.deleted) return false;
    const created = new Date(r.create_date);
    return now.getTime() - created.getTime() < 24 * 60 * 60 * 1000;
  });

  if (recentRecords.length > 0) {
    // Группируем по последним 5 записям
    const latestRecords = recentRecords
      .sort((a, b) => new Date(b.create_date).getTime() - new Date(a.create_date).getTime())
      .slice(0, 5);

    for (const record of latestRecords) {
      const clientName = record.client?.name || 'Клиент';
      const serviceName = record.services?.[0]?.title || 'услугу';
      const staffName = staffMap.get(record.staff_id) || 'мастера';

      notifications.push({
        id: `new-booking-${record.id}`,
        type: 'mention',
        title: 'Новая запись',
        message: `${clientName} записался на ${serviceName} к ${staffName}`,
        timestamp: record.create_date,
        read: false,
        actor: {
          name: clientName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clientName.replace(/\s/g, '')}`,
        },
        target: {
          type: 'page',
          title: serviceName,
          url: '/apps/appointments',
        },
        metadata: {
          workspace: 'Записи',
          pageIcon: '💅',
        },
        action: {
          label: 'Посмотреть',
          url: '/apps/appointments',
          type: 'primary',
        },
      });
    }
  }

  // ==========================================
  // 3. ОТМЕНЫ ЗА ПОСЛЕДНИЕ 3 ДНЯ
  // ==========================================
  const recentCancellations = records.filter((r) => {
    if (!r.deleted) return false;
    const recordDate = new Date(r.date);
    return daysSince(r.date) <= 3;
  });

  if (recentCancellations.length > 0) {
    const todayCancellations = recentCancellations.filter((r) => r.date === today);

    if (todayCancellations.length > 0) {
      notifications.push({
        id: `cancellations-today-${today}`,
        type: 'mention',
        title: 'Отмены сегодня',
        message: `${todayCancellations.length} ${pluralize(todayCancellations.length, 'запись отменена', 'записи отменены', 'записей отменено')} на сегодня`,
        timestamp: now.toISOString(),
        read: false,
        metadata: {
          workspace: 'Записи',
          pageIcon: '❌',
        },
        action: {
          label: 'Посмотреть',
          url: '/apps/appointments?status=CANCELLED',
        },
      });
    }

    // Если отмен много - алерт
    if (recentCancellations.length >= 5) {
      notifications.push({
        id: `cancellation-spike-${today}`,
        type: 'assignment',
        title: 'Всплеск отмен',
        message: `${recentCancellations.length} отмен за последние 3 дня. Рекомендуем проверить причины.`,
        timestamp: now.toISOString(),
        read: false,
        metadata: {
          workspace: 'Аналитика',
          pageIcon: '⚠️',
        },
        action: {
          label: 'Анализировать',
          url: '/dashboard/analytics',
          type: 'primary',
        },
      });
    }
  }

  // ==========================================
  // 4. NO-SHOW ЗА ПОСЛЕДНИЕ 7 ДНЕЙ
  // ==========================================
  const recentNoShows = records.filter((r) => {
    if (r.attendance !== -1) return false;
    return daysSince(r.date) <= 7;
  });

  if (recentNoShows.length > 0) {
    // Показать последние 3 no-show
    const latestNoShows = recentNoShows
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    for (const record of latestNoShows) {
      const clientName = record.client?.name || 'Клиент';

      notifications.push({
        id: `no-show-${record.id}`,
        type: 'assignment',
        title: 'Клиент не пришёл',
        message: `${clientName} не явился на запись ${record.date}`,
        timestamp: new Date(record.date).toISOString(),
        read: false,
        actor: {
          name: clientName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clientName.replace(/\s/g, '')}`,
        },
        target: {
          type: 'task',
          title: 'Пропущенная запись',
          url: '/apps/customers',
        },
        metadata: {
          workspace: 'Записи',
          pageIcon: '🚫',
        },
        action: {
          label: 'Связаться',
          url: '/apps/customers',
        },
      });
    }
  }

  // ==========================================
  // 5. ЗАТУХАЮЩИЕ КЛИЕНТЫ (30-60 ДНЕЙ)
  // ==========================================
  const churningClients = clients.filter((c) => {
    if (!c.last_visit_date) return false;
    const days = daysSince(c.last_visit_date);
    return days >= 30 && days < 60 && c.visit_count >= 2;
  });

  if (churningClients.length > 0) {
    notifications.push({
      id: `churning-clients-${today}`,
      type: 'comment',
      title: 'Клиенты затухают',
      message: `${churningClients.length} ${pluralize(churningClients.length, 'клиент', 'клиента', 'клиентов')} не были 30+ дней. Пора напомнить о себе!`,
      timestamp: now.toISOString(),
      read: false,
      target: {
        type: 'page',
        title: 'Затухающие клиенты',
        url: '/apps/customers?risk_level=MEDIUM',
      },
      metadata: {
        workspace: 'Клиенты',
        pageIcon: '⏰',
      },
      action: {
        label: 'Посмотреть',
        url: '/apps/customers?risk_level=MEDIUM',
        type: 'primary',
      },
    });
  }

  // ==========================================
  // 6. ПОТЕРЯННЫЕ КЛИЕНТЫ (60+ ДНЕЙ)
  // ==========================================
  const lostClients = clients.filter((c) => {
    if (!c.last_visit_date) return false;
    const days = daysSince(c.last_visit_date);
    return days >= 60 && c.visit_count >= 2;
  });

  if (lostClients.length > 0) {
    notifications.push({
      id: `lost-clients-${today}`,
      type: 'comment',
      title: 'Потерянные клиенты',
      message: `${lostClients.length} ${pluralize(lostClients.length, 'клиент', 'клиента', 'клиентов')} не были 60+ дней. Требуется реактивация!`,
      timestamp: now.toISOString(),
      read: false,
      target: {
        type: 'page',
        title: 'Потерянные клиенты',
        url: '/apps/customers?risk_level=HIGH',
      },
      metadata: {
        workspace: 'Клиенты',
        pageIcon: '😢',
      },
      action: {
        label: 'Реактивировать',
        url: '/apps/customers?risk_level=HIGH',
        type: 'primary',
      },
    });
  }

  // ==========================================
  // 7. НОВЫЕ КЛИЕНТЫ ЗА 7 ДНЕЙ
  // ==========================================
  const newClients = clients.filter((c) => {
    if (!c.first_visit_date) return false;
    return daysSince(c.first_visit_date) <= 7;
  });

  if (newClients.length > 0) {
    // Показать последних 3 новых клиентов
    const latestNewClients = newClients
      .sort((a, b) => new Date(b.first_visit_date!).getTime() - new Date(a.first_visit_date!).getTime())
      .slice(0, 3);

    for (const client of latestNewClients) {
      notifications.push({
        id: `new-client-${client.id}`,
        type: 'invite',
        title: 'Новый клиент',
        message: `Зарегистрирован новый клиент: ${client.name}`,
        timestamp: client.first_visit_date || now.toISOString(),
        read: false,
        actor: {
          name: client.name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${client.name.replace(/\s/g, '')}`,
        },
        metadata: {
          workspace: 'Клиенты',
          pageIcon: '👤',
        },
        action: {
          label: 'Открыть профиль',
          url: '/apps/customers',
          type: 'primary',
        },
      });
    }
  }

  // ==========================================
  // 8. НИЗКАЯ ЗАГРУЗКА (следующие 7 дней)
  // ==========================================
  const activeStaff = staff.filter((s) => !s.fired && s.bookable).length || staff.filter((s) => !s.fired).length || 1;
  const slotsPerDay = activeStaff * 8; // 8 слотов на мастера

  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const lowOccupancyDays: string[] = [];

  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);
    const dateStr = getLocalDateString(checkDate);
    const dayRecords = records.filter((r) => r.date === dateStr && !r.deleted);
    const occupancy = slotsPerDay > 0 ? Math.round((dayRecords.length / slotsPerDay) * 100) : 0;

    if (occupancy < 50 && occupancy > 0) {
      const dayOfWeek = checkDate.getDay();
      const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
      lowOccupancyDays.push(`${dayName} (${occupancy}%)`);
    }
  }

  if (lowOccupancyDays.length > 0) {
    notifications.push({
      id: `low-occupancy-${today}`,
      type: 'assignment',
      title: 'Низкая загрузка',
      message: `${lowOccupancyDays.join(', ')} — загрузка менее 50%. Рекомендуем запустить акцию.`,
      timestamp: now.toISOString(),
      read: false,
      metadata: {
        workspace: 'Аналитика',
        pageIcon: '📊',
      },
      action: {
        label: 'Открыть дашборд',
        url: '/dashboard',
        type: 'primary',
      },
    });
  }

  // ==========================================
  // 9. СИНХРОНИЗАЦИЯ YClients
  // ==========================================
  if (syncInfo.lastSyncAt) {
    const lastSync = new Date(syncInfo.lastSyncAt);
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSync <= 1) {
      // Недавняя синхронизация
      notifications.push({
        id: `sync-completed-${syncInfo.lastSyncAt}`,
        type: 'update',
        title: 'Синхронизация завершена',
        message: `Синхронизировано: ${syncInfo.clients} клиентов, ${syncInfo.records} записей, ${syncInfo.staff} мастеров`,
        timestamp: syncInfo.lastSyncAt,
        read: false,
        metadata: {
          workspace: 'Система',
          pageIcon: '🔄',
        },
        action: {
          label: 'Подробнее',
          url: '/apps/sync',
        },
      });
    } else if (hoursSinceSync > 24) {
      // Давно не синхронизировались
      notifications.push({
        id: `sync-needed-${today}`,
        type: 'system',
        title: 'Требуется синхронизация',
        message: `Данные не обновлялись более ${Math.floor(hoursSinceSync)} часов. Рекомендуем синхронизировать.`,
        timestamp: now.toISOString(),
        read: false,
        metadata: {
          workspace: 'Система',
          pageIcon: '⚠️',
        },
        action: {
          label: 'Синхронизировать',
          url: '/apps/sync',
          type: 'primary',
        },
      });
    }
  } else if (records.length === 0 && clients.length === 0) {
    // Нет данных вообще
    notifications.push({
      id: `no-data-${today}`,
      type: 'system',
      title: 'Нет данных',
      message: 'Данные ещё не синхронизированы. Запустите синхронизацию с YClients.',
      timestamp: now.toISOString(),
      read: false,
      metadata: {
        workspace: 'Система',
        pageIcon: '📭',
      },
      action: {
        label: 'Настроить синхронизацию',
        url: '/apps/sync',
        type: 'primary',
      },
    });
  }

  // ==========================================
  // 10. VIP КЛИЕНТЫ (топ по тратам)
  // ==========================================
  const vipClients = clients
    .filter((c) => c.spent > 50000 && c.visit_count >= 5)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  if (vipClients.length > 0 && Math.random() < 0.3) {
    // Показываем не всегда, чтобы не спамить
    const topClient = vipClients[0];
    notifications.push({
      id: `vip-client-${topClient.id}`,
      type: 'share',
      title: 'VIP клиент',
      message: `${topClient.name} — ${topClient.visit_count} визитов, потрачено ${topClient.spent.toLocaleString('ru-RU')} ₽`,
      timestamp: topClient.last_visit_date || now.toISOString(),
      read: true, // VIP уведомления показываем как прочитанные
      actor: {
        name: topClient.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${topClient.name.replace(/\s/g, '')}`,
      },
      metadata: {
        workspace: 'Клиенты',
        pageIcon: '💎',
      },
      action: {
        label: 'Профиль',
        url: '/apps/customers',
      },
    });
  }

  // Сортировка по дате (новые сверху)
  return notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function GET() {
  try {
    const notifications = generateNotifications();

    return NextResponse.json({
      succeeded: true,
      data: notifications,
      errors: [],
      message: 'System notifications generated successfully',
    });
  } catch (error) {
    console.error('Error generating system notifications:', error);
    return NextResponse.json(
      {
        succeeded: false,
        data: [],
        errors: ['Failed to generate system notifications'],
        message: 'Failed to generate system notifications',
      },
      { status: 500 }
    );
  }
}
