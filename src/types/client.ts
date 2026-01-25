export type CommunicationStyle = 'FORMAL' | 'FRIENDLY' | 'MINIMAL';
export type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ClientStatus = 'REGULAR' | 'VIP' | 'PROBLEM' | 'LOST';
export type ClientFilterStatus = 'ALL' | 'VIP' | 'RISK' | 'PROBLEM' | 'NO_SHOW' | 'LOST';

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
  // Поля для фильтрации и аналитики
  visits_count: number;
  no_show_count: number;
  total_spent: number;
  score: number; // ИВК (Индекс Важности Клиента) 0-100
  risk_level: RiskLevel;
  client_status: ClientStatus;
  days_since_last_visit?: number;
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
  // Фильтры для клиентской базы
  client_status?: ClientFilterStatus;
  risk_level?: RiskLevel;
  min_score?: number;
  max_no_shows?: number;
  min_visits?: number;
  days_inactive?: number;
}

export interface ClientsListResponse {
  items: Client[];
  total: number;
  skip: number;
  limit: number;
}
