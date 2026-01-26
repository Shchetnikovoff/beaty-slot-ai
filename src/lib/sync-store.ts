/**
 * In-memory store for sync state
 * Использует global для персистентности между hot reload в Next.js dev mode
 * TODO: Replace with database storage (Prisma/PostgreSQL)
 */

import type { SyncStatus, SyncHistoryItem, SyncConfig } from '@/types/sync';
import type {
  YclientsClient,
  YclientsStaff,
  YclientsService,
  YclientsRecord,
} from '@/lib/yclients';

// ==========================================
// Synced Data Storage (from YClients)
// ==========================================

interface SyncedData {
  clients: YclientsClient[];
  staff: YclientsStaff[];
  services: YclientsService[];
  records: YclientsRecord[];
  lastSyncAt: string | null;
}

// Используем global для персистентности между hot reload
// https://nextjs.org/docs/basic-features/data-fetching/client-side
declare global {
  // eslint-disable-next-line no-var
  var __syncedData: SyncedData | undefined;
  // eslint-disable-next-line no-var
  var __syncStatus: SyncStatus | undefined;
  // eslint-disable-next-line no-var
  var __syncHistory: SyncHistoryItem[] | undefined;
  // eslint-disable-next-line no-var
  var __syncConfig: SyncConfig | undefined;
  // eslint-disable-next-line no-var
  var __currentSyncId: number | null | undefined;
  // eslint-disable-next-line no-var
  var __staffActiveOverrides: Map<number, boolean> | undefined;
}

// Инициализация global переменных если не существуют
if (!global.__syncedData) {
  global.__syncedData = {
    clients: [],
    staff: [],
    services: [],
    records: [],
    lastSyncAt: null,
  };
}

if (!global.__staffActiveOverrides) {
  global.__staffActiveOverrides = new Map<number, boolean>();
}

// Synced data operations
export function setSyncedData(data: Partial<SyncedData>): void {
  Object.assign(global.__syncedData!, data);
}

export function getSyncedClients(): YclientsClient[] {
  return global.__syncedData?.clients || [];
}

export function getSyncedStaff(): YclientsStaff[] {
  return global.__syncedData?.staff || [];
}

export function getSyncedServices(): YclientsService[] {
  return global.__syncedData?.services || [];
}

export function getSyncedRecords(): YclientsRecord[] {
  return global.__syncedData?.records || [];
}

// Staff active overrides operations
export function setStaffActiveOverride(staffId: number, isActive: boolean): void {
  global.__staffActiveOverrides!.set(staffId, isActive);
}

export function getStaffActiveOverride(staffId: number): boolean | undefined {
  return global.__staffActiveOverrides?.get(staffId);
}

export function getSyncedDataInfo(): { clients: number; staff: number; services: number; records: number; lastSyncAt: string | null } {
  const data = global.__syncedData;
  return {
    clients: data?.clients?.length || 0,
    staff: data?.staff?.length || 0,
    services: data?.services?.length || 0,
    records: data?.records?.length || 0,
    lastSyncAt: data?.lastSyncAt || null,
  };
}

// ==========================================
// Sync Status & History (используем global)
// ==========================================

// Инициализация global переменных
if (!global.__syncStatus) {
  global.__syncStatus = {
    is_running: false,
    last_sync_at: null,
    clients_synced: 0,
    clients_skipped: 0,
    errors: [],
  };
}

if (!global.__syncHistory) {
  global.__syncHistory = [];
}

if (!global.__syncConfig) {
  global.__syncConfig = {
    auto_sync_enabled: false,
    sync_interval_hours: 24,
    min_visits_threshold: 3,
  };
}

if (global.__currentSyncId === undefined) {
  global.__currentSyncId = null;
}

// Status operations
export function getSyncStatus(): SyncStatus {
  return { ...global.__syncStatus! };
}

export function updateSyncStatus(update: Partial<SyncStatus>): SyncStatus {
  Object.assign(global.__syncStatus!, update);
  return { ...global.__syncStatus! };
}

export function setSyncRunning(running: boolean): void {
  global.__syncStatus!.is_running = running;
}

// History operations
export function getSyncHistory(limit: number = 10): SyncHistoryItem[] {
  return (global.__syncHistory || []).slice(0, limit);
}

export function addSyncHistoryItem(item: Omit<SyncHistoryItem, 'id'>): SyncHistoryItem {
  const history = global.__syncHistory!;
  const newItem: SyncHistoryItem = {
    ...item,
    id: history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1,
  };
  history.unshift(newItem);
  return newItem;
}

export function updateSyncHistoryItem(id: number, update: Partial<SyncHistoryItem>): SyncHistoryItem | null {
  const history = global.__syncHistory!;
  const index = history.findIndex(h => h.id === id);
  if (index === -1) return null;
  history[index] = { ...history[index], ...update };
  return history[index];
}

export function getCurrentSyncId(): number | null {
  return global.__currentSyncId ?? null;
}

export function setCurrentSyncId(id: number | null): void {
  global.__currentSyncId = id;
}

// Config operations
export function getSyncConfig(): SyncConfig {
  return { ...global.__syncConfig! };
}

export function updateSyncConfig(update: Partial<SyncConfig>): SyncConfig {
  Object.assign(global.__syncConfig!, update);
  return { ...global.__syncConfig! };
}

// Reset (for testing)
export function resetSyncStore(): void {
  global.__syncStatus = {
    is_running: false,
    last_sync_at: null,
    clients_synced: 0,
    clients_skipped: 0,
    errors: [],
  };
  global.__syncHistory = [];
  global.__syncConfig = {
    auto_sync_enabled: false,
    sync_interval_hours: 24,
    min_visits_threshold: 3,
  };
  global.__currentSyncId = null;
  global.__syncedData = {
    clients: [],
    staff: [],
    services: [],
    records: [],
    lastSyncAt: null,
  };
}
