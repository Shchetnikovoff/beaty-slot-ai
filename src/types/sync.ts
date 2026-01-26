/**
 * Типы для функционала синхронизации с YClients
 */

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
}
