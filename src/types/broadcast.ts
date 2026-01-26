export type BroadcastStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';
export type BroadcastTargetAudience = 'ALL' | 'SUBSCRIBED' | 'NOT_SUBSCRIBED';

export interface Broadcast {
  id: number;
  title: string;
  message: string;
  target_audience: BroadcastTargetAudience;
  status: BroadcastStatus;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface BroadcastCreate {
  title: string;
  message: string;
  target_audience: BroadcastTargetAudience;
  scheduled_at?: string;
}

export interface BroadcastUpdate {
  title?: string;
  message?: string;
  target_audience?: BroadcastTargetAudience;
  scheduled_at?: string;
}

export interface BroadcastsListParams {
  [key: string]: string | number | boolean | undefined;
  skip?: number;
  limit?: number;
  status?: BroadcastStatus;
}

export interface BroadcastsListResponse {
  items: Broadcast[];
  total: number;
  skip: number;
  limit: number;
}

export interface BroadcastStats {
  total: number;
  this_month: number;
  total_sent: number;
  delivery_rate: number;
}
