export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  max_visits?: number;
  allowed_categories: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanCreate {
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  max_visits?: number;
  allowed_categories?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface SubscriptionPlanUpdate {
  name?: string;
  description?: string;
  price?: number;
  duration_days?: number;
  max_visits?: number;
  allowed_categories?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface Subscription {
  id: number;
  client_id: string;
  plan_id: number;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  visits_used: number;
  visits_remaining?: number;
  discount_percent: number;
  auto_renew: boolean;
  paused_at?: string;
  pause_reason?: string;
  pause_days_remaining?: number;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  plan: SubscriptionPlan;
}

export interface SubscriptionCreate {
  client_id: string;
  plan_id: number;
  discount_percent?: number;
  auto_renew?: boolean;
}

export interface SubscriptionUpdate {
  status?: SubscriptionStatus;
  auto_renew?: boolean;
  reason?: string;
}

export interface SubscriptionsListParams {
  skip?: number;
  limit?: number;
  client_id?: string;
  status?: SubscriptionStatus;
}

export interface SubscriptionsListResponse {
  items: Subscription[];
  total: number;
  skip: number;
  limit: number;
}
