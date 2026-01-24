export type CommunicationStyle = 'FORMAL' | 'FRIENDLY' | 'MINIMAL';
export type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN';

export interface Client {
  id: number;
  yclients_id?: string;
  telegram_id?: number;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  comment?: string;
  drink_preferences?: string;
  music_preferences?: string;
  communication_style?: CommunicationStyle;
  interests?: string;
  is_blocked: boolean;
  photo_url?: string;
  has_uploaded_photo: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_visit_at?: string;
  has_active_subscription?: boolean;
}

export interface ClientCreate {
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  comment?: string;
  drink_preferences?: string;
  music_preferences?: string;
  communication_style?: CommunicationStyle;
  interests?: string;
  yclients_id?: string;
  telegram_id?: number;
  role?: UserRole;
}

export interface ClientUpdate {
  name?: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  comment?: string;
  drink_preferences?: string;
  music_preferences?: string;
  communication_style?: CommunicationStyle;
  interests?: string;
  is_blocked?: boolean;
  role?: UserRole;
}

export interface ClientsListParams {
  [key: string]: string | number | boolean | undefined;
  skip?: number;
  limit?: number;
  search?: string;
  has_subscription?: boolean;
  is_blocked?: boolean;
}

export interface ClientsListResponse {
  items: Client[];
  total: number;
  skip: number;
  limit: number;
}
