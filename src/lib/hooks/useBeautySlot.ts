'use client';

import { useState, useEffect, useCallback } from 'react';
import { clientsService, subscriptionsService, paymentsService, documentsService, salonsService } from '@/services';
import type {
  Client,
  ClientsListParams,
  ClientsListResponse,
  Subscription,
  SubscriptionsListParams,
  SubscriptionsListResponse,
  SubscriptionPlan,
  Payment,
  PaymentsListParams,
  PaymentsListResponse,
  Document,
  DocumentsListParams,
  DocumentsListResponse,
  Salon,
  SalonsListParams,
  SalonsListResponse,
  SuperadminStats,
} from '@/types';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Hook for clients list
export function useClients(params?: ClientsListParams): UseQueryResult<ClientsListResponse> {
  const [data, setData] = useState<ClientsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await clientsService.getClients(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch clients'));
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.search, params?.has_subscription, params?.is_blocked]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for single client
export function useClient(yclientsId: string | null): UseQueryResult<Client> {
  const [data, setData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!yclientsId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await clientsService.getClient(yclientsId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch client'));
    } finally {
      setLoading(false);
    }
  }, [yclientsId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for subscription plans
export function useSubscriptionPlans(activeOnly?: boolean): UseQueryResult<SubscriptionPlan[]> {
  const [data, setData] = useState<SubscriptionPlan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await subscriptionsService.getPlans(activeOnly);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for subscriptions list
export function useSubscriptions(params?: SubscriptionsListParams): UseQueryResult<SubscriptionsListResponse> {
  const [data, setData] = useState<SubscriptionsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await subscriptionsService.getSubscriptions(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscriptions'));
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.client_id, params?.status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for payments list
export function usePayments(params?: PaymentsListParams): UseQueryResult<PaymentsListResponse> {
  const [data, setData] = useState<PaymentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsService.getPayments(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payments'));
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.client_id, params?.subscription_id, params?.status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for dashboard stats
export function useDashboardStats(): UseQueryResult<{
  totalClients: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newClientsThisMonth: number;
}> {
  const [data, setData] = useState<{
    totalClients: number;
    activeSubscriptions: number;
    totalRevenue: number;
    newClientsThisMonth: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data from multiple endpoints
      const [clients, subscriptions, payments] = await Promise.all([
        clientsService.getClients({ limit: 1 }),
        subscriptionsService.getSubscriptions({ status: 'ACTIVE', limit: 1 }),
        paymentsService.getPayments({ status: 'SUCCEEDED', limit: 1000 }),
      ]);

      const totalRevenue = payments.items.reduce((sum, p) => sum + p.amount, 0);

      setData({
        totalClients: clients.total,
        activeSubscriptions: subscriptions.total,
        totalRevenue,
        newClientsThisMonth: 0, // TODO: Calculate from clients.items
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for documents list
export function useDocuments(params?: DocumentsListParams): UseQueryResult<DocumentsListResponse> {
  const [data, setData] = useState<DocumentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentsService.getList(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch documents'));
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.type, params?.status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for single document
export function useDocument(id: number | null): UseQueryResult<Document> {
  const [data, setData] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await documentsService.getById(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch document'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for salons list (superadmin)
export function useSalons(params?: SalonsListParams): UseQueryResult<SalonsListResponse> {
  const [data, setData] = useState<SalonsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await salonsService.getSalons(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch salons'));
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.search, params?.status, params?.is_active]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for single salon
export function useSalon(id: number | null): UseQueryResult<Salon> {
  const [data, setData] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await salonsService.getSalon(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch salon'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for superadmin stats
export function useSuperadminStats(): UseQueryResult<SuperadminStats> {
  const [data, setData] = useState<SuperadminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await salonsService.getStats();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
