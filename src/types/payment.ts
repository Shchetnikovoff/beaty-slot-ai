export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'BANK_CARD' | 'YOO_MONEY' | 'QIWI' | 'SBP' | 'CASH' | 'OTHER';
export type PaymentType = 'CLIENT_SUBSCRIPTION' | 'ORGANIZATION_SUBSCRIPTION';

export interface Payment {
  id: number;
  client_id: string;
  subscription_id?: number;
  yookassa_payment_id?: string;
  amount: number;
  currency: string;
  description?: string;
  status: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_type: PaymentType;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  failed_at?: string;
  refunded_at?: string;
  confirmation_url?: string;
  error_code?: string;
  error_message?: string;
}

export interface PaymentCreate {
  client_id: string;
  subscription_id?: number;
  amount: number;
  currency?: string;
  description?: string;
  payment_method?: PaymentMethod;
}

export interface PaymentsListParams {
  [key: string]: string | number | boolean | undefined;
  skip?: number;
  limit?: number;
  client_id?: string;
  subscription_id?: number;
  status?: PaymentStatus;
}

export interface PaymentsListResponse {
  items: Payment[];
  total: number;
  skip: number;
  limit: number;
}
