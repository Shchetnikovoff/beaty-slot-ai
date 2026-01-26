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
