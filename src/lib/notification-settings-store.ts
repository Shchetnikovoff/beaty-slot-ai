/**
 * Хранилище настроек уведомлений клиентам
 * In-memory storage with hot-reload persistence
 */

// ==========================================
// Types
// ==========================================

export type NotificationType =
  | 'after_booking'
  | 'booking_reminder_day'
  | 'booking_reminder_hour'
  | 'booking_rescheduled'
  | 'booking_cancelled'
  | 'post_visit'
  | 'birthday'
  | 'welcome';

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  description: string;
  category: 'visits' | 'marketing';
  message: string;
  isActive: boolean;
  variables: string[];
}

// ==========================================
// Default Templates (без подписок)
// ==========================================

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  // Визиты
  {
    id: '1',
    type: 'after_booking',
    name: 'После записи',
    description: 'Отправляется сразу после создания записи',
    category: 'visits',
    message: 'Здравствуйте, {client_name}!\n\nВы записаны на {service_name} к мастеру {staff_name} на {visit_date} в {visit_time}.\n\nЖдём вас!',
    isActive: true,
    variables: ['client_name', 'service_name', 'staff_name', 'visit_date', 'visit_time'],
  },
  {
    id: '2',
    type: 'booking_reminder_day',
    name: 'Напоминание за день',
    description: 'Отправляется в 10:00 за день до визита',
    category: 'visits',
    message: '{client_name}, напоминаем о вашей записи завтра в {visit_time} на {service_name}.\n\nЖдём вас!',
    isActive: true,
    variables: ['client_name', 'service_name', 'visit_time', 'staff_name'],
  },
  {
    id: '3',
    type: 'booking_reminder_hour',
    name: 'Напоминание за час',
    description: 'Отправляется за 1 час до визита',
    category: 'visits',
    message: '{client_name}, через час вас ждёт {service_name} у мастера {staff_name}!\n\nНе забудьте!',
    isActive: true,
    variables: ['client_name', 'service_name', 'staff_name', 'visit_time'],
  },
  {
    id: '4',
    type: 'booking_rescheduled',
    name: 'Запись перенесена',
    description: 'При изменении даты/времени записи',
    category: 'visits',
    message: '{client_name}, ваша запись перенесена на {visit_date} в {visit_time}.\n\nЕсли у вас есть вопросы, свяжитесь с нами.',
    isActive: true,
    variables: ['client_name', 'visit_date', 'visit_time'],
  },
  {
    id: '5',
    type: 'booking_cancelled',
    name: 'Запись отменена',
    description: 'При отмене записи',
    category: 'visits',
    message: '{client_name}, ваша запись на {visit_date} отменена.\n\nБудем рады видеть вас снова!',
    isActive: true,
    variables: ['client_name', 'visit_date'],
  },
  {
    id: '6',
    type: 'post_visit',
    name: 'После посещения',
    description: 'Отправляется через 2 часа после визита',
    category: 'visits',
    message: '{client_name}, спасибо за визит!\n\nНадеемся, вам всё понравилось. Будем рады видеть вас снова!',
    isActive: false,
    variables: ['client_name', 'service_name', 'staff_name'],
  },
  // Маркетинг
  {
    id: '7',
    type: 'birthday',
    name: 'День рождения',
    description: 'Поздравление с днём рождения',
    category: 'marketing',
    message: '{client_name}, поздравляем с днём рождения!\n\nДарим вам скидку 15% на любую услугу в течение недели!',
    isActive: true,
    variables: ['client_name'],
  },
  {
    id: '8',
    type: 'welcome',
    name: 'Приветствие',
    description: 'При первом подключении к боту',
    category: 'marketing',
    message: 'Добро пожаловать, {client_name}!\n\nМы рады, что вы с нами. Через этот бот вы сможете:\n\n📝 Записаться на услугу\n📋 Посмотреть свои записи\n📖 Просмотреть историю визитов',
    isActive: true,
    variables: ['client_name'],
  },
];

// ==========================================
// Global State
// ==========================================

declare global {
  // eslint-disable-next-line no-var
  var __notificationSettings: NotificationTemplate[] | undefined;
  // eslint-disable-next-line no-var
  var __sentNotifications: Map<string, Date> | undefined;
}

function getSettingsStore(): NotificationTemplate[] {
  if (!global.__notificationSettings) {
    global.__notificationSettings = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
  }
  return global.__notificationSettings!;
}

function getSentStore(): Map<string, Date> {
  if (!global.__sentNotifications) {
    global.__sentNotifications = new Map();
  }
  return global.__sentNotifications!;
}

// ==========================================
// Settings CRUD
// ==========================================

/**
 * Получить все настройки уведомлений
 */
export function getNotificationSettings(): NotificationTemplate[] {
  return getSettingsStore();
}

/**
 * Получить настройку по ID
 */
export function getNotificationSettingById(id: string): NotificationTemplate | undefined {
  return getSettingsStore().find(s => s.id === id);
}

/**
 * Получить настройку по типу
 */
export function getNotificationSettingByType(type: NotificationType): NotificationTemplate | undefined {
  return getSettingsStore().find(s => s.type === type);
}

/**
 * Получить активные шаблоны
 */
export function getActiveNotificationSettings(): NotificationTemplate[] {
  return getSettingsStore().filter(s => s.isActive);
}

/**
 * Обновить настройку уведомления
 */
export function updateNotificationSetting(
  id: string,
  updates: Partial<Pick<NotificationTemplate, 'message' | 'isActive'>>
): NotificationTemplate | null {
  const settings = getSettingsStore();
  const index = settings.findIndex(s => s.id === id);

  if (index === -1) return null;

  settings[index] = { ...settings[index], ...updates };
  return settings[index];
}

// ==========================================
// Sent Notifications (для дедупликации)
// ==========================================

/**
 * Создать уникальный ключ для отправленного уведомления
 * Формат: "recordId:type:date"
 */
function createSentKey(recordId: number, type: NotificationType, date: string): string {
  return `${recordId}:${type}:${date}`;
}

/**
 * Отметить уведомление как отправленное
 */
export function markNotificationAsSent(
  recordId: number,
  type: NotificationType,
  date: string
): void {
  const key = createSentKey(recordId, type, date);
  getSentStore().set(key, new Date());
}

/**
 * Проверить было ли уведомление уже отправлено
 */
export function wasNotificationSent(
  recordId: number,
  type: NotificationType,
  date: string
): boolean {
  const key = createSentKey(recordId, type, date);
  return getSentStore().has(key);
}

/**
 * Очистить старые записи об отправленных уведомлениях (старше 7 дней)
 */
export function cleanupSentNotifications(): number {
  const store = getSentStore();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  let cleaned = 0;
  for (const [key, sentAt] of store.entries()) {
    if (sentAt < weekAgo) {
      store.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Получить статистику отправленных уведомлений
 */
export function getSentNotificationsStats(): {
  total: number;
  byType: Record<string, number>;
} {
  const store = getSentStore();
  const byType: Record<string, number> = {};

  for (const key of store.keys()) {
    const [, type] = key.split(':');
    byType[type] = (byType[type] || 0) + 1;
  }

  return {
    total: store.size,
    byType,
  };
}

// ==========================================
// Variable Substitution
// ==========================================

export interface NotificationVariables {
  client_name?: string;
  client_phone?: string;
  service_name?: string;
  staff_name?: string;
  visit_date?: string;
  visit_time?: string;
  salon_name?: string;
}

/**
 * Подставить переменные в шаблон сообщения
 */
export function substituteVariables(
  template: string,
  variables: NotificationVariables
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }

  return result;
}

// ==========================================
// Reset (for testing)
// ==========================================

export function resetNotificationSettingsStore(): void {
  global.__notificationSettings = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
  global.__sentNotifications = new Map();
}
