/**
 * Сервис для синхронизации с YClients
 * Поддерживает real-time синхронизацию через WebSocket/SSE
 */

import { api } from '@/lib/api';
import type {
  SyncStatus,
  SyncHistoryItem,
  SyncConfig,
  ConnectionStatus,
  RealtimeEvent,
  RealtimeStats,
} from '@/types/sync';

const SYNC_ENDPOINT = '/v1/admin/sync';

// Fallback данные на случай ошибки API
const fallbackSyncStatus: SyncStatus = {
  is_running: false,
  last_sync_at: null,
  clients_synced: 0,
  clients_skipped: 0,
  errors: ['API недоступен'],
};

const fallbackSyncConfig: SyncConfig = {
  auto_sync_enabled: false,
  sync_interval_hours: 24,
  min_visits_threshold: 3,
  realtime_enabled: true,
};

const fallbackRealtimeStats: RealtimeStats = {
  events_today: 0,
  clients_synced_today: 0,
  appointments_synced_today: 0,
  last_event_at: null,
  uptime_seconds: 0,
};

// Event emitter для real-time событий
type EventCallback = (event: RealtimeEvent) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class RealtimeSync {
  private eventSource: EventSource | null = null;
  private eventCallbacks: Set<EventCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;

  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      return;
    }

    this.setStatus('connecting');

    try {
      // SSE endpoint для real-time событий
      this.eventSource = new EventSource('/api/v1/admin/sync/realtime');

      this.eventSource.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;
          this.notifyEvent(data);
        } catch (e) {
          console.error('[RealtimeSync] Failed to parse event:', e);
        }
      };

      this.eventSource.onerror = () => {
        this.setStatus('error');
        this.eventSource?.close();
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('[RealtimeSync] Failed to connect:', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[RealtimeSync] Max reconnect attempts reached');
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, Math.min(delay, 30000));
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  private notifyEvent(event: RealtimeEvent): void {
    this.eventCallbacks.forEach((callback) => callback(event));
  }

  onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    // Сразу уведомляем о текущем статусе
    callback(this.connectionStatus);
    return () => this.statusCallbacks.delete(callback);
  }

  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
}

// Синглтон для real-time подключения
export const realtimeSync = new RealtimeSync();

export const syncService = {
  /**
   * Получить текущий статус синхронизации
   */
  async getStatus(): Promise<SyncStatus> {
    try {
      return await api.get<SyncStatus>(`${SYNC_ENDPOINT}/status`);
    } catch (error) {
      console.error('[SyncService] Error getting status:', error);
      return { ...fallbackSyncStatus };
    }
  },

  /**
   * Запустить синхронизацию
   */
  async startSync(): Promise<void> {
    try {
      await api.post(`${SYNC_ENDPOINT}/start`);
    } catch (error) {
      console.error('[SyncService] Error starting sync:', error);
      throw error;
    }
  },

  /**
   * Остановить синхронизацию
   */
  async stopSync(): Promise<void> {
    try {
      await api.post(`${SYNC_ENDPOINT}/stop`);
    } catch (error) {
      console.error('[SyncService] Error stopping sync:', error);
      throw error;
    }
  },

  /**
   * Получить историю синхронизаций
   */
  async getHistory(limit: number = 10): Promise<SyncHistoryItem[]> {
    try {
      return await api.get<SyncHistoryItem[]>(`${SYNC_ENDPOINT}/history`, { limit });
    } catch (error) {
      console.error('[SyncService] Error getting history:', error);
      return [];
    }
  },

  /**
   * Получить конфигурацию синхронизации
   */
  async getConfig(): Promise<SyncConfig> {
    try {
      return await api.get<SyncConfig>(`${SYNC_ENDPOINT}/config`);
    } catch (error) {
      console.error('[SyncService] Error getting config:', error);
      return { ...fallbackSyncConfig };
    }
  },

  /**
   * Обновить конфигурацию синхронизации
   */
  async updateConfig(config: Partial<SyncConfig>): Promise<SyncConfig> {
    try {
      return await api.put<SyncConfig>(`${SYNC_ENDPOINT}/config`, config);
    } catch (error) {
      console.error('[SyncService] Error updating config:', error);
      throw error;
    }
  },

  /**
   * Получить статистику real-time синхронизации
   */
  async getRealtimeStats(): Promise<RealtimeStats> {
    try {
      return await api.get<RealtimeStats>(`${SYNC_ENDPOINT}/realtime/stats`);
    } catch (error) {
      console.error('[SyncService] Error getting realtime stats:', error);
      return { ...fallbackRealtimeStats };
    }
  },

  /**
   * Включить/выключить real-time синхронизацию
   */
  async toggleRealtime(enabled: boolean): Promise<void> {
    try {
      await api.post(`${SYNC_ENDPOINT}/realtime/${enabled ? 'enable' : 'disable'}`);
      if (enabled) {
        realtimeSync.connect();
      } else {
        realtimeSync.disconnect();
      }
    } catch (error) {
      console.error('[SyncService] Error toggling realtime:', error);
      throw error;
    }
  },

  /**
   * Тестировать подключение к YClients
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency_ms?: number }> {
    try {
      return await api.get(`${SYNC_ENDPOINT}/test-connection`);
    } catch (error) {
      console.error('[SyncService] Error testing connection:', error);
      return { success: false, message: 'Не удалось проверить подключение' };
    }
  },
};
