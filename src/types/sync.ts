/**
 * Типы для функционала синхронизации с YClients
 */

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SyncStatus {
  is_running: boolean;
  last_sync_at: string | null;
  clients_synced: number;
  clients_skipped: number;
  errors: string[];
}

export interface SyncHistoryItem {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'error' | 'partial';
  clients_created: number;
  clients_updated: number;
  clients_skipped: number;
  error_message?: string;
}

export interface SyncConfig {
  auto_sync_enabled: boolean;
  sync_interval_hours: number;
  min_visits_threshold: number;
  // Real-time настройки
  realtime_enabled: boolean;
  webhook_url?: string;
}

// Real-time события
export type RealtimeEventType =
  | 'client_created'
  | 'client_updated'
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_cancelled'
  | 'payment_received'
  | 'connection_status';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  timestamp: string;
  data: {
    client_id?: number;
    client_name?: string;
    appointment_id?: number;
    service_name?: string;
    amount?: number;
    status?: string;
    message?: string;
  };
}

export interface RealtimeStats {
  events_today: number;
  clients_synced_today: number;
  appointments_synced_today: number;
  last_event_at: string | null;
  uptime_seconds: number;
}
