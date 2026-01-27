/**
 * Типы для настроек публичной страницы салона
 */

export interface WorkingHours {
  day: number; // 0-6, где 0 - понедельник
  day_name: string;
  is_open: boolean;
  open_time: string; // HH:mm
  close_time: string; // HH:mm
}

export interface SalonSettings {
  // Branding
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  description: string;

  // Contacts
  phone: string;
  email: string;
  address: string;
  map_coordinates: {
    lat: number;
    lng: number;
  } | null;
  working_hours: WorkingHours[];

  // Social
  instagram: string | null;
  telegram: string | null;
  whatsapp: string | null;
  vk: string | null;

  // SEO
  meta_title: string;
  meta_description: string;
  og_image_url: string | null;

  // Features
  booking_enabled: boolean;
  online_payment_enabled: boolean;
  show_prices: boolean;
  show_staff: boolean;

  // Amenities (удобства салона)
  amenities: SalonAmenities;
}

export interface SalonAmenities {
  // Базовые удобства
  wifi: boolean;
  parking: boolean;
  parking_free: boolean;
  air_conditioning: boolean;
  heating: boolean;

  // Гостеприимство
  drinks: boolean; // Чай/кофе
  snacks: boolean; // Закуски
  magazines: boolean; // Журналы
  tv: boolean; // ТВ в зоне ожидания

  // Доступность
  wheelchair_access: boolean;
  elevator: boolean;
  ground_floor: boolean;

  // Для семей
  kids_room: boolean;
  kids_friendly: boolean;
  pet_friendly: boolean;

  // Оплата
  card_payment: boolean;
  cash_payment: boolean;
  online_payment: boolean;
  installments: boolean; // Рассрочка

  // Сервис
  appointment_only: boolean;
  walk_ins_welcome: boolean; // Без записи
  online_consultation: boolean;
  home_service: boolean; // Выезд на дом

  // Программы
  loyalty_program: boolean;
  gift_cards: boolean;
  subscription_plans: boolean;

  // Время работы
  evening_hours: boolean;
  weekend_open: boolean;
  early_morning: boolean;
  open_24h: boolean;

  // Дополнительно
  private_rooms: boolean; // Отдельные кабинеты
  vip_room: boolean;
  sterile_instruments: boolean;
  disposable_tools: boolean;
  organic_products: boolean;
  hypoallergenic_products: boolean;
}

export interface SalonSettingsUpdate extends Partial<SalonSettings> {}

export interface SalonService {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
}

export interface SalonStaff {
  id: number;
  name: string;
  position: string;
  photo_url: string | null;
  bio: string | null;
  services: number[]; // IDs услуг
  is_active: boolean;
}
