/**
 * Сервис для работы с настройками уведомлений клиентам
 */

import { api, isDemoMode } from '@/lib/api';
import type {
  ClientNotificationType,
  NotificationTemplate,
  NotificationTemplateUpdate,
  NotificationVariable,
} from '@/types/notification-settings';
import {
  NOTIFICATION_VARIABLES,
  SAMPLE_DATA,
} from '@/types/notification-settings';

const ENDPOINT = '/v1/admin/notification-templates';

// Mock данные - системные шаблоны по умолчанию
const defaultTemplates: NotificationTemplate[] = [
  // Визиты
  {
    id: 1,
    type: 'after_booking',
    name: 'После записи',
    description: 'Отправляется сразу после создания записи',
    title: 'Запись подтверждена',
    message_text: 'Здравствуйте, {client_name}!\n\nВы записаны на {service_name} к мастеру {staff_name} на {visit_date} в {visit_time}.\n\nЖдём вас!',
    buttons: [{ text: 'Отменить запись', callback_data: 'cancel_visit_{visit_id}' }],
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    type: 'booking_reminder',
    name: 'Напоминание о записи',
    description: 'Отправляется за день до визита',
    title: 'Напоминание о записи',
    message_text: '{client_name}, напоминаем о вашей записи завтра в {visit_time} на услугу "{service_name}".\n\nМастер: {staff_name}\n\nЖдём вас!',
    buttons: [
      { text: 'Подтвердить', callback_data: 'confirm_visit_{visit_id}' },
      { text: 'Перенести', callback_data: 'reschedule_visit_{visit_id}' },
    ],
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    type: 'booking_rescheduled',
    name: 'Запись перенесена',
    description: 'Отправляется при переносе записи',
    title: 'Запись перенесена',
    message_text: '{client_name}, ваша запись на услугу "{service_name}" перенесена на {visit_date} в {visit_time}.\n\nМастер: {staff_name}',
    buttons: null,
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 4,
    type: 'booking_cancelled',
    name: 'Запись отменена',
    description: 'Отправляется при отмене записи',
    title: 'Запись отменена',
    message_text: '{client_name}, ваша запись на услугу "{service_name}" на {visit_date} в {visit_time} отменена.\n\nЕсли хотите записаться снова, свяжитесь с нами!',
    buttons: null,
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 5,
    type: 'post_visit',
    name: 'После посещения',
    description: 'Отправляется после завершения визита',
    title: 'Спасибо за визит!',
    message_text: 'Спасибо, что посетили нас, {client_name}!\n\nБудем рады видеть вас снова в {salon_name}.',
    buttons: [{ text: 'Записаться снова', callback_data: 'book_again' }],
    is_active: true,
    is_system: true,
    send_delay_minutes: 60, // Через час после визита
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  // Подписки
  {
    id: 6,
    type: 'subscription_activated',
    name: 'Подписка активирована',
    description: 'Отправляется при активации подписки',
    title: 'Подписка активирована!',
    message_text: 'Поздравляем, {client_name}!\n\nВаша подписка активирована и действует до {subscription_end_date}.\n\nПриятных посещений!',
    buttons: null,
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 7,
    type: 'subscription_expiring',
    name: 'Подписка истекает (3 дня)',
    description: 'Отправляется за 3 дня до окончания',
    title: 'Подписка скоро истекает',
    message_text: '{client_name}, ваша подписка истекает через {subscription_days_left} дня.\n\nПродлите её, чтобы не потерять скидку!',
    buttons: [{ text: 'Продлить подписку', callback_data: 'renew_subscription_{subscription_id}' }],
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 8,
    type: 'subscription_expiring_soon',
    name: 'Подписка истекает (1 день)',
    description: 'Отправляется за день до окончания',
    title: 'Подписка истекает завтра!',
    message_text: '{client_name}, ваша подписка истекает завтра!\n\nПродлите прямо сейчас, чтобы сохранить все преимущества.',
    buttons: [{ text: 'Продлить сейчас', callback_data: 'renew_subscription_{subscription_id}' }],
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 9,
    type: 'subscription_expired',
    name: 'Подписка истекла',
    description: 'Отправляется после окончания подписки',
    title: 'Подписка истекла',
    message_text: '{client_name}, ваша подписка истекла.\n\nПродлите её, чтобы снова получить скидку на услуги!',
    buttons: [{ text: 'Продлить подписку', callback_data: 'renew_subscription_{subscription_id}' }],
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 10,
    type: 'subscription_renewed',
    name: 'Подписка продлена',
    description: 'Отправляется при продлении подписки',
    title: 'Подписка продлена!',
    message_text: 'Отлично, {client_name}!\n\nВаша подписка продлена до {subscription_end_date}.\n\nПриятных посещений!',
    buttons: null,
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 11,
    type: 'subscription_paused',
    name: 'Подписка приостановлена',
    description: 'Отправляется при приостановке подписки',
    title: 'Подписка приостановлена',
    message_text: '{client_name}, ваша подписка приостановлена.\n\nВы можете возобновить её в любой момент.',
    buttons: [{ text: 'Возобновить', callback_data: 'resume_subscription_{subscription_id}' }],
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 12,
    type: 'subscription_resumed',
    name: 'Подписка возобновлена',
    description: 'Отправляется при возобновлении подписки',
    title: 'Подписка возобновлена!',
    message_text: 'Рады вернуть вас, {client_name}!\n\nВаша подписка возобновлена и действует до {subscription_end_date}.',
    buttons: null,
    is_active: true,
    is_system: true,
    send_delay_minutes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// Локальное состояние для демо
let localTemplates = [...defaultTemplates];

export const notificationSettingsService = {
  /**
   * Получить все шаблоны
   */
  async getTemplates(): Promise<NotificationTemplate[]> {
    if (isDemoMode()) {
      return [...localTemplates];
    }
    try {
      return await api.get<NotificationTemplate[]>(ENDPOINT);
    } catch {
      // Fallback to mock data if API is unavailable
      return [...localTemplates];
    }
  },

  /**
   * Получить шаблон по типу
   */
  async getTemplateByType(type: ClientNotificationType): Promise<NotificationTemplate | null> {
    if (isDemoMode()) {
      return localTemplates.find(t => t.type === type) || null;
    }
    try {
      return await api.get<NotificationTemplate>(`${ENDPOINT}/type/${type}`);
    } catch {
      return localTemplates.find(t => t.type === type) || null;
    }
  },

  /**
   * Обновить шаблон
   */
  async updateTemplate(id: number, data: NotificationTemplateUpdate): Promise<NotificationTemplate> {
    const updateLocal = () => {
      const index = localTemplates.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Шаблон не найден');
      }
      localTemplates[index] = {
        ...localTemplates[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return { ...localTemplates[index] };
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.put<NotificationTemplate>(`${ENDPOINT}/${id}`, data);
    } catch {
      return updateLocal();
    }
  },

  /**
   * Включить/выключить уведомление
   */
  async toggleTemplate(id: number): Promise<NotificationTemplate> {
    const toggleLocal = () => {
      const index = localTemplates.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Шаблон не найден');
      }
      localTemplates[index] = {
        ...localTemplates[index],
        is_active: !localTemplates[index].is_active,
        updated_at: new Date().toISOString(),
      };
      return { ...localTemplates[index] };
    };

    if (isDemoMode()) {
      return toggleLocal();
    }
    try {
      return await api.post<NotificationTemplate>(`${ENDPOINT}/${id}/toggle`);
    } catch {
      return toggleLocal();
    }
  },

  /**
   * Сбросить шаблон к значению по умолчанию
   */
  async resetToDefault(type: ClientNotificationType): Promise<NotificationTemplate> {
    const resetLocal = () => {
      const defaultTemplate = defaultTemplates.find(t => t.type === type);
      if (!defaultTemplate) {
        throw new Error('Шаблон по умолчанию не найден');
      }
      const index = localTemplates.findIndex(t => t.type === type);
      if (index !== -1) {
        localTemplates[index] = {
          ...defaultTemplate,
          id: localTemplates[index].id,
          updated_at: new Date().toISOString(),
        };
        return { ...localTemplates[index] };
      }
      return { ...defaultTemplate };
    };

    if (isDemoMode()) {
      return resetLocal();
    }
    try {
      return await api.post<NotificationTemplate>(`${ENDPOINT}/type/${type}/reset`);
    } catch {
      return resetLocal();
    }
  },

  /**
   * Получить доступные переменные
   */
  getVariables(): NotificationVariable[] {
    return NOTIFICATION_VARIABLES;
  },

  /**
   * Превью сообщения с подстановкой переменных
   */
  previewMessage(template: string, data?: Record<string, string>): string {
    const variables = data || SAMPLE_DATA;
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return result;
  },

  /**
   * Получить примерные данные для превью
   */
  getSampleData(): Record<string, string> {
    return { ...SAMPLE_DATA };
  },
};
