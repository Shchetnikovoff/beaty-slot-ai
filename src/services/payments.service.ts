import { api, isDemoMode } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import type {
  Payment,
  PaymentCreate,
  PaymentsListParams,
  PaymentsListResponse,
} from '@/types';

// Локальное состояние для демо
let localPayments: Payment[] = [...mockData.payments.items] as unknown as Payment[];

export const paymentsService = {
  async getPayments(params?: PaymentsListParams): Promise<PaymentsListResponse> {
    const getLocal = (): PaymentsListResponse => {
      let items = [...localPayments];

      if (params?.status) {
        items = items.filter(p => p.status === params.status);
      }
      if (params?.client_id) {
        items = items.filter(p => p.client_id === params.client_id);
      }

      const skip = params?.skip || 0;
      const limit = params?.limit || 50;

      return {
        items: items.slice(skip, skip + limit) as Payment[],
        total: items.length,
        skip,
        limit,
      };
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<PaymentsListResponse>('/v1/payments', params);
    } catch {
      return getLocal();
    }
  },

  async getPayment(paymentId: number): Promise<Payment> {
    const getLocal = (): Payment => {
      const payment = localPayments.find(p => p.id === paymentId);
      return (payment || localPayments[0]) as Payment;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<Payment>(`/v1/payments/${paymentId}`);
    } catch {
      return getLocal();
    }
  },

  async createPayment(data: PaymentCreate): Promise<Payment> {
    const createLocal = (): Payment => {
      const maxId = Math.max(...localPayments.map(p => p.id), 0);
      const newPayment: Payment = {
        id: maxId + 1,
        client_id: data.client_id,
        subscription_id: data.subscription_id,
        amount: data.amount,
        description: data.description,
        payment_method: data.payment_method,
        status: 'PENDING',
        currency: data.currency || 'RUB',
        payment_type: 'CLIENT_SUBSCRIPTION',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localPayments.push(newPayment);
      return newPayment;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<Payment>('/v1/payments', data);
    } catch {
      return createLocal();
    }
  },

  async checkPaymentStatus(paymentId: number): Promise<Payment> {
    const checkLocal = (): Payment => {
      const payment = localPayments.find(p => p.id === paymentId);
      return (payment || localPayments[0]) as Payment;
    };

    if (isDemoMode()) {
      return checkLocal();
    }
    try {
      return await api.post<Payment>(`/v1/payments/${paymentId}/check`);
    } catch {
      return checkLocal();
    }
  },

  async refundPayment(paymentId: number): Promise<Payment> {
    const refundLocal = (): Payment => {
      const index = localPayments.findIndex(p => p.id === paymentId);
      if (index !== -1) {
        localPayments[index] = {
          ...localPayments[index],
          status: 'REFUNDED',
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return localPayments[index] as Payment;
      }
      return localPayments[0] as Payment;
    };

    if (isDemoMode()) {
      return refundLocal();
    }
    try {
      return await api.post<Payment>(`/v1/payments/${paymentId}/refund`);
    } catch {
      return refundLocal();
    }
  },
};
