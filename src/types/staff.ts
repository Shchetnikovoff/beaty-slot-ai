export type StaffRole = 'MASTER' | 'ADMIN' | 'MANAGER';

export interface Staff {
  id: number;
  yclients_id?: string;
  name: string;
  phone?: string;
  email?: string;
  role: StaffRole;
  specialization?: string;
  photo_url?: string;
  is_active: boolean;
  schedule?: string;
  appointments_count?: number;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface StaffCreate {
  name: string;
  phone?: string;
  email?: string;
  role: StaffRole;
  specialization?: string;
  photo_url?: string;
}

export interface StaffUpdate {
  name?: string;
  phone?: string;
  email?: string;
  role?: StaffRole;
  specialization?: string;
  photo_url?: string;
  is_active?: boolean;
  schedule?: string;
}

export interface StaffListParams {
  [key: string]: string | number | boolean | undefined;
  skip?: number;
  limit?: number;
  role?: StaffRole;
  is_active?: boolean;
  search?: string;
}

export interface StaffListResponse {
  items: Staff[];
  total: number;
  skip: number;
  limit: number;
}

export interface StaffTodayStats {
  total: number;
  active_today: number;
  appointments_today: number;
}
