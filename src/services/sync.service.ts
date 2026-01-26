/**
 * Сервис для синхронизации с YClients
 * Использует локальные Next.js API routes для работы с реальным Yclients API
 */

import { api } from '@/lib/api';
import type { SyncStatus, SyncHistoryItem, SyncConfig } from '@/types/sync';

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
};

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
};
