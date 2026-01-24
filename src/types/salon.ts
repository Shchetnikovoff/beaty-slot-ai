export type SalonSubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';

export interface SalonLimits {
  max_clients?: number;
  max_admins?: number;
  max_subscription_plans?: number;
}

export interface Salon {
  id: number;
  yclients_company_id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  timezone: string;
  status: SalonSubscriptionStatus;
  trial_start_date?: string;
  trial_end_date?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_plan_id?: number;
  enabled_features: string[];
  limits: SalonLimits;
  owner_client_id?: number;
  created_at: string;
  updated_at: string;
}

export interface SalonCreate {
  yclients_company_id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone?: string;
}

export interface SalonUpdate {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  timezone?: string;
  enabled_features?: string[];
  limits?: SalonLimits;
}
