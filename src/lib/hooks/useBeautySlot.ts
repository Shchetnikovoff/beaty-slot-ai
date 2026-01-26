'use client';

import { useState, useEffect, useCallback } from 'react';
import { clientsService, subscriptionsService, paymentsService, documentsService, salonsService, appointmentsService, staffService, broadcastsService } from '@/services';
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
  Appointment,
  AppointmentsListParams,
  AppointmentsListResponse,
  AppointmentsTodayStats,
  Staff,
  StaffListParams,
  StaffListResponse,
  StaffTodayStats,
  Broadcast,
  BroadcastsListParams,
  BroadcastsListResponse,
  BroadcastStats,
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
  }, [params?.skip, params?.limit, params?.search, params?.has_subscription, params?.is_blocked, params?.client_status, params?.risk_level, params?.max_no_shows, params?.min_visits]);

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

// Hook for appointments list
export function useAppointments(params?: AppointmentsListParams): UseQueryResult<AppointmentsListResponse> {
  const [data, setData] = useState<AppointmentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await appointmentsService.getAppointments(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.status, params?.staff_id, params?.client_id, params?.date_from, params?.date_to]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for single appointment
export function useAppointment(id: number | null): UseQueryResult<Appointment> {
  const [data, setData] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await appointmentsService.getAppointment(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch appointment'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for today's appointments stats
export function useAppointmentsTodayStats(): UseQueryResult<AppointmentsTodayStats> {
  const [data, setData] = useState<AppointmentsTodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await appointmentsService.getTodayStats();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch appointments stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for appointments stats by date
export function useAppointmentsStats(date: string): UseQueryResult<AppointmentsTodayStats> {
  const [data, setData] = useState<AppointmentsTodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await appointmentsService.getStats(date);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch appointments stats'));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for staff list
export function useStaff(params?: StaffListParams): UseQueryResult<StaffListResponse> {
  const [data, setData] = useState<StaffListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await staffService.getStaff(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch staff'));
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.role, params?.is_active, params?.search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for single staff member
export function useStaffMember(id: number | null): UseQueryResult<Staff> {
  const [data, setData] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await staffService.getStaffMember(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch staff member'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for today's staff stats
export function useStaffTodayStats(): UseQueryResult<StaffTodayStats> {
  const [data, setData] = useState<StaffTodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await staffService.getTodayStats();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch staff stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for broadcasts list
export function useBroadcasts(params?: BroadcastsListParams): UseQueryResult<BroadcastsListResponse> {
  const [data, setData] = useState<BroadcastsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await broadcastsService.getList(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch broadcasts'));
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for single broadcast
export function useBroadcast(id: number | null): UseQueryResult<Broadcast> {
  const [data, setData] = useState<Broadcast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await broadcastsService.getById(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch broadcast'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Hook for broadcasts stats
export function useBroadcastsStats(): UseQueryResult<BroadcastStats> {
  const [data, setData] = useState<BroadcastStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await broadcastsService.getStats();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch broadcasts stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Dashboard stats types
interface DashboardStatsData {
  revenue: {
    today: number;
    week: number;
    month: number;
    recordsToday: number;
    recordsThisWeek: number;
    recordsThisMonth: number;
  };
  occupancy: {
    weekData: {
      day: string;
      date: string;
      occupancy: number;
      bookedSlots: number;
      totalSlots: number;
      isPast: boolean;
      isToday: boolean;
    }[];
    avgOccupancy: number;
  };
  retention: {
    data: {
      month: string;
      newClients: number;
      returned: number;
      rate: number;
    }[];
    currentRate: number;
  };
  lostClients: {
    items: {
      id: number;
      name: string;
      phone: string;
      lastVisit: string;
      daysAgo: number;
    }[];
    risk30_60: number;
    risk60plus: number;
  };
  alerts: {
    type: string;
    title: string;
    count: string;
  }[];
}

// Hook for dashboard stats from synced YClients data
// date - опциональный параметр YYYY-MM-DD, если не передан - используется сегодня
export function useDashboardStatsFromSync(date?: string): UseQueryResult<DashboardStatsData> {
  const [data, setData] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = date
        ? `/api/v1/admin/dashboard/stats?date=${date}`
        : '/api/v1/admin/dashboard/stats';
      const response = await globalThis.fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard stats'));
    } finally {
      setLoading(false);
    }
  }, [date]); // Зависимость от date для автоматического refetch при смене даты

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Payment from YClients sync data types
interface YclientsPaymentData {
  paid_full: number;
  attendance: number; // 2=ожидает, 1=пришёл, 0=нет инфо, -1=неявка
  visit_attendance: number;
  confirmed: number; // 1=подтверждён
  deleted: boolean;
  online: boolean;
  seance_length: number;
  prepaid: string;
  prepaid_confirmed: boolean;
}

interface PaymentFromSync {
  id: number;
  record_id: number;
  client_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  staff_id: string;
  staff_name: string;
  service_id: string;
  service_name: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  payment_method: string;
  description: string;
  created_at: string;
  visit_date: string;
  paid_at?: string;
  source: 'yclients' | 'native';
  yclients_data: YclientsPaymentData;
}

interface PaymentsFromSyncData {
  items: PaymentFromSync[];
  total: number;
  skip: number;
  limit: number;
  stats: {
    total: number;
    succeeded: number;
    pending: number;
    processing: number;
    cancelled: number;
    totalAmount: number;
    succeededAmount: number;
  };
}

interface PaymentsFromSyncParams {
  status?: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  date_from?: string;
  date_to?: string;
  limit?: number;
  skip?: number;
}

// Hook for payments from synced YClients data
export function usePaymentsFromSync(params?: PaymentsFromSyncParams): UseQueryResult<PaymentsFromSyncData> {
  const [data, setData] = useState<PaymentsFromSyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.date_from) searchParams.set('date_from', params.date_from);
      if (params?.date_to) searchParams.set('date_to', params.date_to);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.skip) searchParams.set('skip', String(params.skip));

      const query = searchParams.toString();
      const url = `/api/v1/admin/payments/data${query ? `?${query}` : ''}`;

      const response = await globalThis.fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch payments data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payments data'));
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.date_from, params?.date_to, params?.limit, params?.skip]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
