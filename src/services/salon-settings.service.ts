/**
 * Сервис для работы с настройками публичной страницы салона
 */

import { api, isDemoMode } from '@/lib/api';
import type {
  SalonSettings,
  SalonSettingsUpdate,
  SalonService,
  SalonStaff,
  WorkingHours,
} from '@/types/salon-settings';

const SETTINGS_ENDPOINT = '/v1/admin/salon-settings';

// Mock данные для демо-режима
const defaultWorkingHours: WorkingHours[] = [
  { day: 0, day_name: 'Понедельник', is_open: true, open_time: '09:00', close_time: '21:00' },
  { day: 1, day_name: 'Вторник', is_open: true, open_time: '09:00', close_time: '21:00' },
  { day: 2, day_name: 'Среда', is_open: true, open_time: '09:00', close_time: '21:00' },
  { day: 3, day_name: 'Четверг', is_open: true, open_time: '09:00', close_time: '21:00' },
  { day: 4, day_name: 'Пятница', is_open: true, open_time: '09:00', close_time: '21:00' },
  { day: 5, day_name: 'Суббота', is_open: true, open_time: '10:00', close_time: '20:00' },
  { day: 6, day_name: 'Воскресенье', is_open: false, open_time: '10:00', close_time: '18:00' },
];

const mockSalonSettings: SalonSettings = {
  name: 'Beauty Slot',
  logo_url: null,
  primary_color: '#8B5CF6',
  secondary_color: '#EC4899',
  description: 'Салон красоты премиум-класса. Маникюр, педикюр, уход за волосами, косметология.',

  phone: '+7 (999) 123-45-67',
  email: 'info@beautyslot.ru',
  address: 'г. Москва, ул. Примерная, д. 1',
  map_coordinates: { lat: 55.7558, lng: 37.6173 },
  working_hours: defaultWorkingHours,

  instagram: 'beautyslot',
  telegram: 'beautyslot_bot',
  whatsapp: '+79991234567',
  vk: 'beautyslot',

  meta_title: 'Beauty Slot — Салон красоты',
  meta_description: 'Салон красоты Beauty Slot. Маникюр, педикюр, уход за волосами и лицом. Запись онлайн.',
  og_image_url: null,

  booking_enabled: true,
  online_payment_enabled: false,
  show_prices: true,
  show_staff: true,

  amenities: {
    // Базовые удобства
    wifi: true,
    parking: true,
    parking_free: false,
    air_conditioning: true,
    heating: true,

    // Гостеприимство
    drinks: true,
    snacks: false,
    magazines: true,
    tv: false,

    // Доступность
    wheelchair_access: false,
    elevator: false,
    ground_floor: true,

    // Для семей
    kids_room: false,
    kids_friendly: true,
    pet_friendly: false,

    // Оплата
    card_payment: true,
    cash_payment: true,
    online_payment: false,
    installments: false,

    // Сервис
    appointment_only: false,
    walk_ins_welcome: true,
    online_consultation: false,
    home_service: false,

    // Программы
    loyalty_program: true,
    gift_cards: true,
    subscription_plans: false,

    // Время работы
    evening_hours: true,
    weekend_open: true,
    early_morning: false,
    open_24h: false,

    // Помещение
    private_rooms: true,
    vip_room: false,

    // Гигиена
    sterile_instruments: true,
    disposable_tools: true,
    organic_products: false,
    hypoallergenic_products: true,
  },
};

const mockServices: SalonService[] = [
  { id: 1, name: 'Маникюр классический', description: 'Классический маникюр с покрытием', price: 1500, duration_minutes: 60, category: 'Маникюр', is_active: true },
  { id: 2, name: 'Маникюр аппаратный', description: 'Аппаратный маникюр с укреплением', price: 2000, duration_minutes: 90, category: 'Маникюр', is_active: true },
  { id: 3, name: 'Педикюр классический', description: 'Классический педикюр', price: 2500, duration_minutes: 90, category: 'Педикюр', is_active: true },
  { id: 4, name: 'Стрижка женская', description: 'Стрижка любой сложности', price: 3000, duration_minutes: 60, category: 'Волосы', is_active: true },
  { id: 5, name: 'Окрашивание волос', description: 'Профессиональное окрашивание', price: 5000, duration_minutes: 180, category: 'Волосы', is_active: true },
  { id: 6, name: 'Чистка лица', description: 'Механическая чистка лица', price: 4000, duration_minutes: 90, category: 'Косметология', is_active: true },
];

const mockStaff: SalonStaff[] = [
  { id: 1, name: 'Анна Иванова', position: 'Мастер маникюра', photo_url: 'https://randomuser.me/api/portraits/women/1.jpg', bio: 'Опыт работы 5 лет', services: [1, 2, 3], is_active: true },
  { id: 2, name: 'Мария Петрова', position: 'Стилист', photo_url: 'https://randomuser.me/api/portraits/women/2.jpg', bio: 'Опыт работы 8 лет', services: [4, 5], is_active: true },
  { id: 3, name: 'Елена Сидорова', position: 'Косметолог', photo_url: 'https://randomuser.me/api/portraits/women/3.jpg', bio: 'Опыт работы 10 лет', services: [6], is_active: true },
];

// Локальное состояние для демо
let localSettings = { ...mockSalonSettings };
let localServices = [...mockServices];
let localStaff = [...mockStaff];

export const salonSettingsService = {
  /**
   * Получить настройки салона
   */
  async getSettings(): Promise<SalonSettings> {
    if (isDemoMode()) {
      return { ...localSettings };
    }
    try {
      return await api.get<SalonSettings>(SETTINGS_ENDPOINT);
    } catch {
      // Fallback to mock data if API is unavailable
      return { ...localSettings };
    }
  },

  /**
   * Обновить настройки салона
   */
  async updateSettings(data: SalonSettingsUpdate): Promise<SalonSettings> {
    if (isDemoMode()) {
      localSettings = { ...localSettings, ...data };
      return { ...localSettings };
    }
    try {
      return await api.put<SalonSettings>(SETTINGS_ENDPOINT, data);
    } catch {
      // Fallback: update local and return
      localSettings = { ...localSettings, ...data };
      return { ...localSettings };
    }
  },

  /**
   * Загрузить логотип
   */
  async uploadLogo(file: File): Promise<string> {
    if (isDemoMode()) {
      const url = URL.createObjectURL(file);
      localSettings.logo_url = url;
      return url;
    }

    try {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await api.post<{ url: string }>(`${SETTINGS_ENDPOINT}/logo`, formData);
      return response.url;
    } catch {
      // Fallback: create object URL
      const url = URL.createObjectURL(file);
      localSettings.logo_url = url;
      return url;
    }
  },

  /**
   * Получить список услуг
   */
  async getServices(): Promise<SalonService[]> {
    if (isDemoMode()) {
      return [...localServices];
    }
    try {
      return await api.get<SalonService[]>(`${SETTINGS_ENDPOINT}/services`);
    } catch {
      return [...localServices];
    }
  },

  /**
   * Получить список персонала
   */
  async getStaff(): Promise<SalonStaff[]> {
    if (isDemoMode()) {
      return [...localStaff];
    }
    try {
      return await api.get<SalonStaff[]>(`${SETTINGS_ENDPOINT}/staff`);
    } catch {
      return [...localStaff];
    }
  },

  /**
   * Получить публичные данные салона (для публичной страницы)
   */
  async getPublicInfo(): Promise<{
    settings: SalonSettings;
    services: SalonService[];
    staff: SalonStaff[];
  }> {
    if (isDemoMode()) {
      return {
        settings: { ...localSettings },
        services: localServices.filter(s => s.is_active),
        staff: localStaff.filter(s => s.is_active),
      };
    }
    try {
      return await api.get(`${SETTINGS_ENDPOINT}/public`);
    } catch {
      return {
        settings: { ...localSettings },
        services: localServices.filter(s => s.is_active),
        staff: localStaff.filter(s => s.is_active),
      };
    }
  },
};
