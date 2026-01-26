/**
 * Типы для настроек уведомлений клиентам
 */

/**
 * Типы триггерных уведомлений для клиентов
 */
export type ClientNotificationType =
  // Визиты
  | 'after_booking'
  | 'booking_reminder'
  | 'booking_rescheduled'
  | 'booking_cancelled'
  | 'post_visit'
  // Подписки
  | 'subscription_activated'
  | 'subscription_expiring'
  | 'subscription_expiring_soon'
  | 'subscription_expired'
  | 'subscription_renewed'
  | 'subscription_paused'
  | 'subscription_resumed';

/**
 * Категория уведомления
 */
export type NotificationCategory = 'visits' | 'subscriptions';

/**
 * Информация о типе уведомления
 */
export interface NotificationTypeInfo {
  type: ClientNotificationType;
  name: string;
  description: string;
  category: NotificationCategory;
}

/**
 * Все типы уведомлений с метаданными
 */
export const NOTIFICATION_TYPES: NotificationTypeInfo[] = [
  // Визиты
  {
    type: 'after_booking',
    name: 'После записи',
    description: 'Отправляется сразу после создания записи',
    category: 'visits',
  },
  {
    type: 'booking_reminder',
    name: 'Напоминание о записи',
    description: 'Отправляется за день до визита',
    category: 'visits',
  },
  {
    type: 'booking_rescheduled',
    name: 'Запись перенесена',
    description: 'Отправляется при переносе записи',
    category: 'visits',
  },
  {
    type: 'booking_cancelled',
    name: 'Запись отменена',
    description: 'Отправляется при отмене записи',
    category: 'visits',
  },
  {
    type: 'post_visit',
    name: 'После посещения',
    description: 'Отправляется после завершения визита',
    category: 'visits',
  },
  // Подписки
  {
    type: 'subscription_activated',
    name: 'Подписка активирована',
    description: 'Отправляется при активации подписки',
    category: 'subscriptions',
  },
  {
    type: 'subscription_expiring',
    name: 'Подписка истекает (3 дня)',
    description: 'Отправляется за 3 дня до окончания',
    category: 'subscriptions',
  },
  {
    type: 'subscription_expiring_soon',
    name: 'Подписка истекает (1 день)',
    description: 'Отправляется за день до окончания',
    category: 'subscriptions',
  },
  {
    type: 'subscription_expired',
    name: 'Подписка истекла',
    description: 'Отправляется после окончания подписки',
    category: 'subscriptions',
  },
  {
    type: 'subscription_renewed',
    name: 'Подписка продлена',
    description: 'Отправляется при продлении подписки',
    category: 'subscriptions',
  },
  {
    type: 'subscription_paused',
    name: 'Подписка приостановлена',
    description: 'Отправляется при приостановке подписки',
    category: 'subscriptions',
  },
  {
    type: 'subscription_resumed',
    name: 'Подписка возобновлена',
    description: 'Отправляется при возобновлении подписки',
    category: 'subscriptions',
  },
];

/**
 * Кнопка в уведомлении (Telegram inline button)
 */
export interface NotificationButton {
  text: string;
  callback_data?: string;
  url?: string;
}

/**
 * Шаблон уведомления
 */
export interface NotificationTemplate {
  id: number;
  type: ClientNotificationType;
  name: string;
  description: string | null;
  title: string;
  message_text: string;
  buttons: NotificationButton[] | null;
  is_active: boolean;
  is_system: boolean;
  send_delay_minutes: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Данные для обновления шаблона
 */
export interface NotificationTemplateUpdate {
  title?: string;
  message_text?: string;
  buttons?: NotificationButton[] | null;
  is_active?: boolean;
  send_delay_minutes?: number | null;
}

/**
 * Категория переменной
 */
export type VariableCategory = 'client' | 'visit' | 'subscription' | 'salon';

/**
 * Переменная для подстановки в шаблон
 */
export interface NotificationVariable {
  name: string;
  description: string;
  category: VariableCategory;
  example: string;
}

/**
 * Доступные переменные для подстановки
 */
export const NOTIFICATION_VARIABLES: NotificationVariable[] = [
  // Клиент
  { name: 'client_name', description: 'Имя клиента', category: 'client', example: 'Иван' },
  { name: 'client_phone', description: 'Телефон клиента', category: 'client', example: '+7 999 123-45-67' },
  { name: 'client_email', description: 'Email клиента', category: 'client', example: 'ivan@mail.ru' },
  // Визит
  { name: 'visit_date', description: 'Дата записи', category: 'visit', example: '25.01.2025' },
  { name: 'visit_time', description: 'Время записи', category: 'visit', example: '14:00' },
  { name: 'visit_datetime', description: 'Дата и время', category: 'visit', example: '25.01.2025 в 14:00' },
  { name: 'service_name', description: 'Название услуги', category: 'visit', example: 'Маникюр' },
  { name: 'staff_name', description: 'Имя мастера', category: 'visit', example: 'Анна Иванова' },
  { name: 'visit_id', description: 'ID записи', category: 'visit', example: '12345' },
  // Подписка
  { name: 'subscription_start_date', description: 'Дата начала подписки', category: 'subscription', example: '01.01.2025' },
  { name: 'subscription_end_date', description: 'Дата окончания подписки', category: 'subscription', example: '31.01.2025' },
  { name: 'subscription_days_left', description: 'Дней до окончания', category: 'subscription', example: '3' },
  { name: 'subscription_id', description: 'ID подписки', category: 'subscription', example: '789' },
  // Салон
  { name: 'salon_name', description: 'Название салона', category: 'salon', example: 'Beauty Slot' },
];

/**
 * Примерные данные для превью
 */
export const SAMPLE_DATA: Record<string, string> = {
  client_name: 'Иван',
  client_phone: '+7 999 123-45-67',
  client_email: 'ivan@mail.ru',
  visit_date: '25.01.2025',
  visit_time: '14:00',
  visit_datetime: '25.01.2025 в 14:00',
  service_name: 'Маникюр классический',
  staff_name: 'Анна Иванова',
  visit_id: '12345',
  subscription_start_date: '01.01.2025',
  subscription_end_date: '31.01.2025',
  subscription_days_left: '3',
  subscription_id: '789',
  salon_name: 'Beauty Slot',
};
