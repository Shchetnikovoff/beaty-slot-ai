/**
 * In-memory store for Telegram links and broadcasts
 * Использует global для персистентности между hot reload в Next.js dev mode
 */

import type { Broadcast, BroadcastStatus } from '@/types/broadcast';

// ==========================================
// Types
// ==========================================

export interface TelegramLink {
  clientId: number;
  telegramId: number;
  phone: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  linkedAt: string;
}

export interface StoredBroadcast extends Omit<Broadcast, 'id'> {
  id: number;
  clientIds?: number[]; // Конкретные клиенты для рассылки
  segmentId?: string; // ID сегмента для рассылки
}

// ==========================================
// Global Storage Declarations
// ==========================================

declare global {
  // eslint-disable-next-line no-var
  var __telegramLinks: Map<string, TelegramLink> | undefined; // phone -> TelegramLink
  // eslint-disable-next-line no-var
  var __telegramIdToPhone: Map<number, string> | undefined; // telegramId -> phone
  // eslint-disable-next-line no-var
  var __broadcasts: StoredBroadcast[] | undefined;
  // eslint-disable-next-line no-var
  var __broadcastIdCounter: number | undefined;
}

// ==========================================
// Initialize Global Variables
// ==========================================

if (!global.__telegramLinks) {
  global.__telegramLinks = new Map<string, TelegramLink>();
}

if (!global.__telegramIdToPhone) {
  global.__telegramIdToPhone = new Map<number, string>();
}

if (!global.__broadcasts) {
  global.__broadcasts = [];
}

if (global.__broadcastIdCounter === undefined) {
  global.__broadcastIdCounter = 1;
}

// ==========================================
// Phone Number Normalization
// ==========================================

/**
 * Нормализация номера телефона (убираем все кроме цифр, добавляем 7 для России)
 */
export function normalizePhone(phone: string): string {
  // Убираем все кроме цифр
  let digits = phone.replace(/\D/g, '');

  // Если начинается с 8, заменяем на 7
  if (digits.startsWith('8') && digits.length === 11) {
    digits = '7' + digits.slice(1);
  }

  // Если нет кода страны, добавляем 7
  if (digits.length === 10) {
    digits = '7' + digits;
  }

  return digits;
}

// ==========================================
// Telegram Links Operations
// ==========================================

/**
 * Связать клиента с Telegram
 */
export function linkTelegram(
  phone: string,
  telegramId: number,
  clientId: number,
  userInfo?: { firstName?: string; lastName?: string; username?: string }
): TelegramLink {
  const normalizedPhone = normalizePhone(phone);

  const link: TelegramLink = {
    clientId,
    telegramId,
    phone: normalizedPhone,
    firstName: userInfo?.firstName,
    lastName: userInfo?.lastName,
    username: userInfo?.username,
    linkedAt: new Date().toISOString(),
  };

  global.__telegramLinks!.set(normalizedPhone, link);
  global.__telegramIdToPhone!.set(telegramId, normalizedPhone);

  console.log(`[TelegramStore] Linked phone ${normalizedPhone} to telegram ${telegramId}`);

  return link;
}

/**
 * Получить связку по номеру телефона
 */
export function getTelegramLinkByPhone(phone: string): TelegramLink | undefined {
  const normalizedPhone = normalizePhone(phone);
  return global.__telegramLinks?.get(normalizedPhone);
}

/**
 * Получить связку по telegram ID
 */
export function getTelegramLinkByTelegramId(telegramId: number): TelegramLink | undefined {
  const phone = global.__telegramIdToPhone?.get(telegramId);
  if (!phone) return undefined;
  return global.__telegramLinks?.get(phone);
}

/**
 * Получить telegram_id по номеру телефона
 */
export function getTelegramIdByPhone(phone: string): number | undefined {
  const link = getTelegramLinkByPhone(phone);
  return link?.telegramId;
}

/**
 * Получить все связки
 */
export function getAllTelegramLinks(): TelegramLink[] {
  return Array.from(global.__telegramLinks?.values() || []);
}

/**
 * Получить количество связанных клиентов
 */
export function getLinkedClientsCount(): number {
  return global.__telegramLinks?.size || 0;
}

/**
 * Удалить связку
 */
export function unlinkTelegram(phone: string): boolean {
  const normalizedPhone = normalizePhone(phone);
  const link = global.__telegramLinks?.get(normalizedPhone);

  if (link) {
    global.__telegramLinks?.delete(normalizedPhone);
    global.__telegramIdToPhone?.delete(link.telegramId);
    return true;
  }

  return false;
}

/**
 * Проверить, связан ли telegram_id
 */
export function isTelegramLinked(telegramId: number): boolean {
  return global.__telegramIdToPhone?.has(telegramId) || false;
}

// ==========================================
// Broadcasts Operations
// ==========================================

/**
 * Создать рассылку
 */
export function createBroadcast(
  data: Omit<StoredBroadcast, 'id' | 'created_at' | 'status' | 'sent_count' | 'failed_count'>
): StoredBroadcast {
  const broadcast: StoredBroadcast = {
    ...data,
    id: global.__broadcastIdCounter!++,
    status: 'DRAFT' as BroadcastStatus,
    sent_count: 0,
    failed_count: 0,
    created_at: new Date().toISOString(),
  };

  global.__broadcasts!.unshift(broadcast);

  console.log(`[TelegramStore] Created broadcast #${broadcast.id}: ${broadcast.title}`);

  return broadcast;
}

/**
 * Получить список рассылок
 */
export function getBroadcasts(options?: {
  skip?: number;
  limit?: number;
  status?: BroadcastStatus;
}): { items: StoredBroadcast[]; total: number } {
  let broadcasts = [...(global.__broadcasts || [])];

  // Фильтр по статусу
  if (options?.status) {
    broadcasts = broadcasts.filter((b) => b.status === options.status);
  }

  const total = broadcasts.length;

  // Пагинация
  const skip = options?.skip || 0;
  const limit = options?.limit || 20;
  broadcasts = broadcasts.slice(skip, skip + limit);

  return { items: broadcasts, total };
}

/**
 * Получить рассылку по ID
 */
export function getBroadcastById(id: number): StoredBroadcast | undefined {
  return global.__broadcasts?.find((b) => b.id === id);
}

/**
 * Обновить рассылку
 */
export function updateBroadcast(
  id: number,
  data: Partial<StoredBroadcast>
): StoredBroadcast | null {
  const index = global.__broadcasts?.findIndex((b) => b.id === id) ?? -1;

  if (index === -1) return null;

  global.__broadcasts![index] = {
    ...global.__broadcasts![index],
    ...data,
  };

  return global.__broadcasts![index];
}

/**
 * Удалить рассылку
 */
export function deleteBroadcast(id: number): boolean {
  const index = global.__broadcasts?.findIndex((b) => b.id === id) ?? -1;

  if (index === -1) return false;

  global.__broadcasts!.splice(index, 1);
  return true;
}

/**
 * Получить статистику рассылок
 */
export function getBroadcastsStats(): {
  total: number;
  thisMonth: number;
  sent: number;
  deliveryRate: number;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
} {
  const broadcasts = global.__broadcasts || [];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = broadcasts.filter(
    (b) => new Date(b.created_at) >= startOfMonth
  ).length;

  const sentBroadcasts = broadcasts.filter((b) => b.status === 'SENT');
  const totalSent = broadcasts.reduce((sum, b) => sum + b.sent_count, 0);
  const totalFailed = broadcasts.reduce((sum, b) => sum + b.failed_count, 0);
  const totalRecipients = broadcasts.reduce((sum, b) => sum + b.recipients_count, 0);

  const deliveryRate =
    totalRecipients > 0 ? Math.round((totalSent / totalRecipients) * 100) : 0;

  return {
    total: broadcasts.length,
    thisMonth,
    sent: sentBroadcasts.length,
    deliveryRate,
    totalRecipients,
    totalSent,
    totalFailed,
  };
}

// ==========================================
// Reset (for testing)
// ==========================================

export function resetTelegramStore(): void {
  global.__telegramLinks = new Map<string, TelegramLink>();
  global.__telegramIdToPhone = new Map<number, string>();
  global.__broadcasts = [];
  global.__broadcastIdCounter = 1;
}
