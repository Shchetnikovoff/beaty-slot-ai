import { api } from '@/lib/api';
import type {
  Broadcast,
  BroadcastCreate,
  BroadcastUpdate,
  BroadcastsListParams,
  BroadcastsListResponse,
  BroadcastStats,
} from '@/types/broadcast';

const BROADCASTS_ENDPOINT = '/v1/admin/broadcasts';

export const broadcastsService = {
  /**
   * Получить список рассылок
   */
  async getList(params?: BroadcastsListParams): Promise<BroadcastsListResponse> {
    return api.get<BroadcastsListResponse, BroadcastsListParams>(BROADCASTS_ENDPOINT, params);
  },

  /**
   * Получить рассылку по ID
   */
  async getById(id: number): Promise<Broadcast> {
    return api.get<Broadcast>(`${BROADCASTS_ENDPOINT}/${id}`);
  },

  /**
   * Создать новую рассылку
   */
  async create(data: BroadcastCreate): Promise<Broadcast> {
    return api.post<Broadcast>(BROADCASTS_ENDPOINT, data);
  },

  /**
   * Обновить рассылку
   */
  async update(id: number, data: BroadcastUpdate): Promise<Broadcast> {
    return api.patch<Broadcast>(`${BROADCASTS_ENDPOINT}/${id}`, data);
  },

  /**
   * Удалить рассылку
   */
  async delete(id: number): Promise<void> {
    return api.delete<void>(`${BROADCASTS_ENDPOINT}/${id}`);
  },

  /**
   * Отправить рассылку немедленно
   */
  async send(id: number): Promise<Broadcast> {
    return api.post<Broadcast>(`${BROADCASTS_ENDPOINT}/${id}/send`);
  },

  /**
   * Отменить запланированную рассылку
   */
  async cancel(id: number): Promise<Broadcast> {
    return api.post<Broadcast>(`${BROADCASTS_ENDPOINT}/${id}/cancel`);
  },

  /**
   * Получить статистику рассылок
   */
  async getStats(): Promise<BroadcastStats> {
    return api.get<BroadcastStats>(`${BROADCASTS_ENDPOINT}/stats`);
  },
};
