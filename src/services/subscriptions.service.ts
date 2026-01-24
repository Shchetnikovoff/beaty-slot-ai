import { api } from '@/lib/api';
import type {
  Subscription,
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionsListParams,
  SubscriptionsListResponse,
  SubscriptionPlan,
  SubscriptionPlanCreate,
  SubscriptionPlanUpdate,
} from '@/types';

export const subscriptionsService = {
  // Subscription Plans
  async getPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]> {
    return api.get<SubscriptionPlan[]>('/v1/subscriptions/plans', {
      active_only: activeOnly,
    });
  },

  async getPlan(planId: number): Promise<SubscriptionPlan> {
    return api.get<SubscriptionPlan>(`/v1/subscriptions/plans/${planId}`);
  },

  async createPlan(data: SubscriptionPlanCreate): Promise<SubscriptionPlan> {
    return api.post<SubscriptionPlan>('/v1/subscriptions/plans', data);
  },

  async updatePlan(planId: number, data: SubscriptionPlanUpdate): Promise<SubscriptionPlan> {
    return api.put<SubscriptionPlan>(`/v1/subscriptions/plans/${planId}`, data);
  },

  async deletePlan(planId: number): Promise<void> {
    return api.delete(`/v1/subscriptions/plans/${planId}`);
  },

  // Subscriptions
  async getSubscriptions(params?: SubscriptionsListParams): Promise<SubscriptionsListResponse> {
    return api.get<SubscriptionsListResponse>('/v1/subscriptions', params);
  },

  async getSubscription(subscriptionId: number): Promise<Subscription> {
    return api.get<Subscription>(`/v1/subscriptions/${subscriptionId}`);
  },

  async createSubscription(data: SubscriptionCreate): Promise<Subscription> {
    return api.post<Subscription>('/v1/subscriptions', data);
  },

  async updateSubscription(subscriptionId: number, data: SubscriptionUpdate): Promise<Subscription> {
    return api.put<Subscription>(`/v1/subscriptions/${subscriptionId}`, data);
  },

  async activateSubscription(subscriptionId: number): Promise<Subscription> {
    return api.post<Subscription>(`/v1/subscriptions/${subscriptionId}/activate`);
  },

  async cancelSubscription(subscriptionId: number, reason?: string): Promise<Subscription> {
    return api.post<Subscription>(`/v1/subscriptions/${subscriptionId}/cancel`, { reason });
  },

  async pauseSubscription(subscriptionId: number, reason?: string): Promise<Subscription> {
    return api.post<Subscription>(`/v1/subscriptions/${subscriptionId}/pause`, { reason });
  },

  async resumeSubscription(subscriptionId: number): Promise<Subscription> {
    return api.post<Subscription>(`/v1/subscriptions/${subscriptionId}/resume`);
  },
};
