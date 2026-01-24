import type { Client } from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: Client;
}

export interface AdminAuth {
  id: number;
  username: string;
  role: 'ADMIN' | 'SUPERADMIN';
  salon_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
