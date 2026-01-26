'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ==================== SMART SEGMENTS ====================

type SegmentId =
  | 'recoverable_7d'
  | 'need_discount'
  | 'urgent_reactivation'
  | 'vip_no_touch'
  | 'new_needs_attention'
  | 'potential_vip';

type SegmentPriority = 'HIGH' | 'MEDIUM' | 'LOW';
type RecommendedChannel = 'telegram' | 'sms' | 'whatsapp' | 'email';

interface SegmentClient {
  id: number;
  name: string;
  phone: string;
  email: string;
  last_visit_date: string | null;
  days_since_visit: number;
  visit_count: number;
  avg_sum: number;
  total_spent: number;
}

interface SmartSegment {
  id: SegmentId;
  name: string;
  description: string;
  criteria: string;
  count: number;
  potential_revenue: number;
  priority: SegmentPriority;
  recommended_action: string;
  recommended_channel: RecommendedChannel;
  message_template: string;
  clients: SegmentClient[];
}

interface BroadcastSuggestion {
  segment_id: SegmentId;
  segment_name: string;
  client_count: number;
  template: string;
  channel: RecommendedChannel;
  best_send_time: string;
  expected_response_rate: number;
}

interface SmartSegmentsData {
  segments: SmartSegment[];
  summary: {
    total_segments: number;
    total_clients_in_segments: number;
    total_potential_revenue: number;
    high_priority_clients: number;
    avg_check: number;
  };
  broadcast_suggestions: BroadcastSuggestion[];
}

interface SmartSegmentsParams {
  include_clients?: boolean;
  limit?: number;
}

export function useSmartSegments(params?: SmartSegmentsParams): UseQueryResult<SmartSegmentsData> {
  const [data, setData] = useState<SmartSegmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.include_clients) searchParams.set('include_clients', 'true');
      if (params?.limit) searchParams.set('limit', String(params.limit));

      const query = searchParams.toString();
      const url = `/api/v1/admin/analytics/smart-segments${query ? `?${query}` : ''}`;

      const response = await globalThis.fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch smart segments');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch smart segments'));
    } finally {
      setLoading(false);
    }
  }, [params?.include_clients, params?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== LTV ANALYSIS ====================

type LTVSegment = 'diamond' | 'gold' | 'silver' | 'bronze';

interface LTVClient {
  id: number;
  name: string;
  phone: string;
  current_value: number;
  ltv: number;
  segment: LTVSegment;
  churn_risk: number;
  visit_count: number;
  months_as_client: number;
  visits_per_month: number;
}

interface LTVSegmentStats {
  count: number;
  percentage: number;
  total_ltv: number;
  avg_ltv: number;
  revenue_percent: number;
}

interface LTVData {
  clients: LTVClient[];
  pareto: {
    top_20_percent_count: number;
    their_revenue: number;
    their_revenue_percent: number;
    total_revenue: number;
    insight: string;
  };
  segments: Record<LTVSegment, LTVSegmentStats>;
  summary: {
    total_clients: number;
    total_ltv: number;
    avg_ltv: number;
    median_ltv: number;
    max_ltv: number;
  };
  insights: string[];
}

interface LTVParams {
  limit?: number;
  segment?: LTVSegment;
}

export function useLTV(params?: LTVParams): UseQueryResult<LTVData> {
  const [data, setData] = useState<LTVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.segment) searchParams.set('segment', params.segment);

      const query = searchParams.toString();
      const url = `/api/v1/admin/analytics/ltv${query ? `?${query}` : ''}`;

      const response = await globalThis.fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch LTV data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch LTV data'));
    } finally {
      setLoading(false);
    }
  }, [params?.limit, params?.segment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== NO-SHOW PREDICTION ====================

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RiskyAppointment {
  record_id: number;
  client_id: number;
  client_name: string;
  client_phone: string;
  datetime: string;
  date: string;
  time: string;
  day_name: string;
  service_name: string;
  staff_name: string;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
  recommendations: string[];
  client_history: {
    total_visits: number;
    no_shows: number;
    no_show_rate: number;
  };
}

interface NoShowPatterns {
  worst_day: string;
  worst_day_rate: number;
  worst_time: string;
  worst_time_rate: number;
  high_risk_clients: number;
  overall_no_show_rate: number;
}

interface NoShowData {
  upcoming: RiskyAppointment[];
  patterns: NoShowPatterns;
  summary: {
    total_upcoming: number;
    high_risk_count: number;
    critical_risk_count: number;
    potential_loss: number;
    days_analyzed: number;
  };
  day_distribution: {
    day: string;
    total: number;
    no_shows: number;
    rate: number;
  }[];
  time_distribution: {
    hour: string;
    total: number;
    no_shows: number;
    rate: number;
  }[];
}

interface NoShowParams {
  days_ahead?: number;
  risk_level?: RiskLevel;
  staff_id?: number;
}

export function useNoShowPrediction(params?: NoShowParams): UseQueryResult<NoShowData> {
  const [data, setData] = useState<NoShowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.days_ahead) searchParams.set('days_ahead', String(params.days_ahead));
      if (params?.risk_level) searchParams.set('risk_level', params.risk_level);
      if (params?.staff_id) searchParams.set('staff_id', String(params.staff_id));

      const query = searchParams.toString();
      const url = `/api/v1/admin/analytics/noshow-prediction${query ? `?${query}` : ''}`;

      const response = await globalThis.fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch no-show prediction');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch no-show prediction'));
    } finally {
      setLoading(false);
    }
  }, [params?.days_ahead, params?.risk_level, params?.staff_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== STAFF PERFORMANCE ====================

interface StaffMetrics {
  total_records: number;
  revenue: number;
  avg_check: number;
  occupancy_percent: number;
  return_rate: number;
  no_show_rate: number;
  cancel_rate: number;
  unique_clients: number;
  new_clients: number;
}

interface StaffScores {
  revenue_score: number;
  retention_score: number;
  reliability_score: number;
  overall_score: number;
}

interface StaffPerformance {
  id: number;
  name: string;
  specialization: string | null;
  avatar: string | null;
  metrics: StaffMetrics;
  scores: StaffScores;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

interface NewClientAllocation {
  staff_id: number;
  staff_name: string;
  reason: string;
  priority: number;
  current_load: number;
}

interface StaffPerformanceData {
  staff: StaffPerformance[];
  new_client_allocation: NewClientAllocation[];
  summary: {
    total_staff: number;
    total_revenue: number;
    avg_revenue_per_staff: number;
    top_performer: string | null;
    avg_return_rate: number;
    avg_no_show_rate: number;
  };
  insights: string[];
}

interface StaffPerformanceParams {
  period?: 'week' | 'month' | '3months';
}

export function useStaffPerformance(params?: StaffPerformanceParams): UseQueryResult<StaffPerformanceData> {
  const [data, setData] = useState<StaffPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.period) searchParams.set('period', params.period);

      const query = searchParams.toString();
      const url = `/api/v1/admin/analytics/staff-performance${query ? `?${query}` : ''}`;

      const response = await globalThis.fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch staff performance');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch staff performance'));
    } finally {
      setLoading(false);
    }
  }, [params?.period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== EMPTY SLOTS FORECAST ====================

type SlotRiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';

interface EmptySlot {
  start: string;
  end: string;
  staff_id: number;
  staff_name: string;
  duration_hours: number;
}

interface DayForecast {
  date: string;
  day_name: string;
  occupancy_percent: number;
  risk_level: SlotRiskLevel;
  total_slots: number;
  booked_slots: number;
  empty_slots: EmptySlot[];
  recommendations: string[];
  is_today: boolean;
  is_past: boolean;
}

interface CalendarView {
  date: string;
  day_name: string;
  occupancy: number;
  risk: SlotRiskLevel;
  color: string;
}

interface EmptySlotsData {
  forecast: DayForecast[];
  summary: {
    days_analyzed: number;
    high_risk_days: number;
    medium_risk_days: number;
    avg_occupancy: number;
    worst_day: {
      date: string;
      day_name: string;
      occupancy: number;
    } | null;
    total_empty_hours: number;
    active_staff_count: number;
  };
  insights: (string | null)[];
  calendar_view: CalendarView[];
}

interface EmptySlotsParams {
  days_ahead?: number;
  staff_id?: number;
}

export function useEmptySlotsForcast(params?: EmptySlotsParams): UseQueryResult<EmptySlotsData> {
  const [data, setData] = useState<EmptySlotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.days_ahead) searchParams.set('days_ahead', String(params.days_ahead));
      if (params?.staff_id) searchParams.set('staff_id', String(params.staff_id));

      const query = searchParams.toString();
      const url = `/api/v1/admin/analytics/empty-slots-forecast${query ? `?${query}` : ''}`;

      const response = await globalThis.fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch empty slots forecast');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch empty slots forecast'));
    } finally {
      setLoading(false);
    }
  }, [params?.days_ahead, params?.staff_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== TRAFFIC SOURCES ====================

type SourceType = 'online_widget' | 'aggregator' | 'direct' | 'admin' | 'unknown';

interface TrafficSource {
  source: SourceType;
  source_name: string;
  source_detail: string | null;
  records_count: number;
  percentage: number;
  unique_clients: number;
  revenue: number;
  avg_check: number;
  conversion_note: string;
}

interface SourceBreakdown {
  detail: string;
  count: number;
  percentage: number;
  revenue: number;
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface TrafficSourcesData {
  sources: TrafficSource[];
  totals: {
    total_records: number;
    online_percentage: number;
    total_revenue: number;
    avg_check: number;
    new_clients: number;
    period: {
      start: string;
      end: string;
    };
  };
  breakdowns: Record<string, SourceBreakdown[]>;
  insights: string[];
  recommendations: string[];
  chart_data: ChartData[];
}

interface TrafficSourcesParams {
  period?: 'week' | 'month' | '3months' | 'year';
  start_date?: string;
  end_date?: string;
}

export function useTrafficSources(params?: TrafficSourcesParams): UseQueryResult<TrafficSourcesData> {
  const [data, setData] = useState<TrafficSourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.period) searchParams.set('period', params.period);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);

      const query = searchParams.toString();
      const url = `/api/v1/admin/analytics/traffic-sources${query ? `?${query}` : ''}`;

      const response = await globalThis.fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch traffic sources');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch traffic sources'));
    } finally {
      setLoading(false);
    }
  }, [params?.period, params?.start_date, params?.end_date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== EXPORTS ====================

export type {
  // Smart Segments
  SmartSegmentsData,
  SmartSegment,
  SegmentClient,
  SegmentId,
  SegmentPriority,
  RecommendedChannel,
  BroadcastSuggestion,
  // LTV
  LTVData,
  LTVClient,
  LTVSegment,
  LTVSegmentStats,
  // No-Show
  NoShowData,
  RiskyAppointment,
  NoShowPatterns,
  RiskLevel,
  // Staff Performance
  StaffPerformanceData,
  StaffPerformance,
  StaffMetrics,
  StaffScores,
  NewClientAllocation,
  // Empty Slots
  EmptySlotsData,
  DayForecast,
  EmptySlot,
  SlotRiskLevel,
  CalendarView,
  // Traffic Sources
  TrafficSourcesData,
  TrafficSource,
  SourceType,
  SourceBreakdown,
  ChartData,
};
