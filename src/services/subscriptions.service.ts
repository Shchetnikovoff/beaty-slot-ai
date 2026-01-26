import { api, isDemoMode } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
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

// Локальное состояние для демо
let localPlans: SubscriptionPlan[] = [...mockData.subscriptionPlans] as unknown as SubscriptionPlan[];
let localSubscriptions: Subscription[] = [...mockData.subscriptions.items] as unknown as Subscription[];

export const subscriptionsService = {
  // Subscription Plans
  async getPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]> {
    const getLocal = (): SubscriptionPlan[] => {
      let plans = [...localPlans];
      if (activeOnly) {
        plans = plans.filter(p => p.is_active);
      }
      return plans as SubscriptionPlan[];
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<SubscriptionPlan[]>('/v1/subscriptions/plans', {
        active_only: activeOnly,
      });
    } catch {
      return getLocal();
    }
  },

  async getPlan(planId: number): Promise<SubscriptionPlan> {
    const getLocal = (): SubscriptionPlan => {
      const plan = localPlans.find(p => p.id === planId);
      return (plan || localPlans[0]) as SubscriptionPlan;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<SubscriptionPlan>(`/v1/subscriptions/plans/${planId}`);
    } catch {
      return getLocal();
    }
  },

  async createPlan(data: SubscriptionPlanCreate): Promise<SubscriptionPlan> {
    const createLocal = (): SubscriptionPlan => {
      const maxId = Math.max(...localPlans.map(p => p.id), 0);
      const newPlan: SubscriptionPlan = {
        id: maxId + 1,
        name: data.name,
        description: data.description,
        price: data.price,
        duration_days: data.duration_days,
        max_visits: data.max_visits,
        allowed_categories: data.allowed_categories || [],
        is_active: data.is_active ?? true,
        sort_order: data.sort_order ?? localPlans.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localPlans.push(newPlan);
      return newPlan;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<SubscriptionPlan>('/v1/subscriptions/plans', data);
    } catch {
      return createLocal();
    }
  },

  async updatePlan(planId: number, data: SubscriptionPlanUpdate): Promise<SubscriptionPlan> {
    const updateLocal = (): SubscriptionPlan => {
      const index = localPlans.findIndex(p => p.id === planId);
      if (index !== -1) {
        localPlans[index] = {
          ...localPlans[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        return localPlans[index] as SubscriptionPlan;
      }
      return localPlans[0] as SubscriptionPlan;
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.put<SubscriptionPlan>(`/v1/subscriptions/plans/${planId}`, data);
    } catch {
      return updateLocal();
    }
  },

  async deletePlan(planId: number): Promise<void> {
    const deleteLocal = () => {
      localPlans = localPlans.filter(p => p.id !== planId);
    };

    if (isDemoMode()) {
      deleteLocal();
      return;
    }
    try {
      await api.delete(`/v1/subscriptions/plans/${planId}`);
    } catch {
      deleteLocal();
    }
  },

  // Subscriptions
  async getSubscriptions(params?: SubscriptionsListParams): Promise<SubscriptionsListResponse> {
    const getLocal = (): SubscriptionsListResponse => {
      let items = [...localSubscriptions];

      if (params?.status) {
        items = items.filter(s => s.status === params.status);
      }
      if (params?.client_id) {
        items = items.filter(s => s.client_id === params.client_id);
      }

      const skip = params?.skip || 0;
      const limit = params?.limit || 50;

      return {
        items: items.slice(skip, skip + limit) as Subscription[],
        total: items.length,
        skip,
        limit,
      };
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<SubscriptionsListResponse>('/v1/subscriptions', params);
    } catch {
      return getLocal();
    }
  },

  async getSubscription(subscriptionId: number): Promise<Subscription> {
    const getLocal = (): Subscription => {
      const sub = localSubscriptions.find(s => s.id === subscriptionId);
      return (sub || localSubscriptions[0]) as Subscription;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<Subscription>(`/v1/subscriptions/${subscriptionId}`);
    } catch {
      return getLocal();
    }
  },

  async createSubscription(data: SubscriptionCreate): Promise<Subscription> {
    const createLocal = (): Subscription => {
      const maxId = Math.max(...localSubscriptions.map(s => s.id), 0);
      const plan = localPlans.find(p => p.id === data.plan_id);
      const defaultPlan: SubscriptionPlan = plan ?? {
        id: data.plan_id,
        name: 'Unknown Plan',
        description: '',
        price: 0,
        duration_days: 30,
        max_visits: 0,
        allowed_categories: [],
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const newSub: Subscription = {
        id: maxId + 1,
        client_id: data.client_id,
        plan_id: data.plan_id,
        status: 'PENDING' as const,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visits_used: 0,
        discount_percent: plan?.price ? 10 : 0,
        auto_renew: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan: defaultPlan,
      };
      localSubscriptions.push(newSub);
      return newSub as Subscription;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<Subscription>('/v1/subscriptions', data);
    } catch {
      return createLocal();
    }
  },

  async updateSubscription(subscriptionId: number, data: SubscriptionUpdate): Promise<Subscription> {
    const updateLocal = (): Subscription => {
      const index = localSubscriptions.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        localSubscriptions[index] = {
          ...localSubscriptions[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        return localSubscriptions[index] as Subscription;
      }
      return localSubscriptions[0] as Subscription;
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.put<Subscription>(`/v1/subscriptions/${subscriptionId}`, data);
    } catch {
      return updateLocal();
    }
  },

  async activateSubscription(subscriptionId: number): Promise<Subscription> {
    const activateLocal = (): Subscription => {
      const index = localSubscriptions.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        localSubscriptions[index] = {
          ...localSubscriptions[index],
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        };
        return localSubscriptions[index] as Subscription;
      }
      return localSubscriptions[0] as Subscription;
    };

    if (isDemoMode()) {
      return activateLocal();
    }
    try {
      return await api.post<Subscription>(`/v1/subscriptions/${subscriptionId}/activate`);
    } catch {
      return activateLocal();
    }
  },

  async cancelSubscription(subscriptionId: number, reason?: string): Promise<Subscription> {
    const cancelLocal = (): Subscription => {
      const index = localSubscriptions.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        localSubscriptions[index] = {
          ...localSubscriptions[index],
          status: 'CANCELLED',
          updated_at: new Date().toISOString(),
        };
        return localSubscriptions[index] as Subscription;
      }
      return localSubscriptions[0] as Subscription;
    };

    if (isDemoMode()) {
      return cancelLocal();
    }
    try {
      return await api.post<Subscription>(`/v1/subscriptions/${subscriptionId}/cancel`, { reason });
    } catch {
      return cancelLocal();
    }
  },

  async pauseSubscription(subscriptionId: number, reason?: string): Promise<Subscription> {
    const pauseLocal = (): Subscription => {
      const index = localSubscriptions.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        localSubscriptions[index] = {
          ...localSubscriptions[index],
          status: 'PAUSED',
          updated_at: new Date().toISOString(),
        };
        return localSubscriptions[index] as Subscription;
      }
      return localSubscriptions[0] as Subscription;
    };

    if (isDemoMode()) {
      return pauseLocal();
    }
    try {
      return await api.post<Subscription>(`/v1/subscriptions/${subscriptionId}/pause`, { reason });
    } catch {
      return pauseLocal();
    }
  },

  async resumeSubscription(subscriptionId: number): Promise<Subscription> {
    const resumeLocal = (): Subscription => {
      const index = localSubscriptions.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        localSubscriptions[index] = {
          ...localSubscriptions[index],
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        };
        return localSubscriptions[index] as Subscription;
      }
      return localSubscriptions[0] as Subscription;
    };

    if (isDemoMode()) {
      return resumeLocal();
    }
    try {
      return await api.post<Subscription>(`/v1/subscriptions/${subscriptionId}/resume`);
    } catch {
      return resumeLocal();
    }
  },
};
