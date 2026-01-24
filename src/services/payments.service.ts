import { api } from '@/lib/api';
import type {
  Payment,
  PaymentCreate,
  PaymentsListParams,
  PaymentsListResponse,
} from '@/types';

export const paymentsService = {
  async getPayments(params?: PaymentsListParams): Promise<PaymentsListResponse> {
    return api.get<PaymentsListResponse>('/v1/payments', params);
  },

  async getPayment(paymentId: number): Promise<Payment> {
    return api.get<Payment>(`/v1/payments/${paymentId}`);
  },

  async createPayment(data: PaymentCreate): Promise<Payment> {
    return api.post<Payment>('/v1/payments', data);
  },

  async checkPaymentStatus(paymentId: number): Promise<Payment> {
    return api.post<Payment>(`/v1/payments/${paymentId}/check`);
  },

  async refundPayment(paymentId: number): Promise<Payment> {
    return api.post<Payment>(`/v1/payments/${paymentId}/refund`);
  },
};
