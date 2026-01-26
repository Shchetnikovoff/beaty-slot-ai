import { api, isDemoMode } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import type {
  Broadcast,
  BroadcastCreate,
  BroadcastUpdate,
  BroadcastsListParams,
  BroadcastsListResponse,
  BroadcastStats,
} from '@/types/broadcast';

const BROADCASTS_ENDPOINT = '/v1/admin/broadcasts';

// Локальное состояние для демо
let localBroadcasts: Broadcast[] = [...mockData.broadcasts.items] as Broadcast[];

export const broadcastsService = {
  /**
   * Получить список рассылок
   */
  async getList(params?: BroadcastsListParams): Promise<BroadcastsListResponse> {
    const getLocal = (): BroadcastsListResponse => {
      let items = [...localBroadcasts];

      if (params?.status) {
        items = items.filter(b => b.status === params.status);
      }

      const skip = params?.skip || 0;
      const limit = params?.limit || 50;

      return {
        items: items.slice(skip, skip + limit) as Broadcast[],
        total: items.length,
        skip,
        limit,
      };
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<BroadcastsListResponse, BroadcastsListParams>(BROADCASTS_ENDPOINT, params);
    } catch {
      return getLocal();
    }
  },

  /**
   * Получить рассылку по ID
   */
  async getById(id: number): Promise<Broadcast> {
    const getLocal = (): Broadcast => {
      const broadcast = localBroadcasts.find(b => b.id === id);
      return (broadcast || localBroadcasts[0]) as Broadcast;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<Broadcast>(`${BROADCASTS_ENDPOINT}/${id}`);
    } catch {
      return getLocal();
    }
  },

  /**
   * Создать новую рассылку
   */
  async create(data: BroadcastCreate): Promise<Broadcast> {
    const createLocal = (): Broadcast => {
      const maxId = Math.max(...localBroadcasts.map(b => b.id), 0);
      const newBroadcast: Broadcast = {
        id: maxId + 1,
        title: data.title,
        message: data.message,
        target_audience: data.target_audience,
        scheduled_at: data.scheduled_at,
        status: 'DRAFT',
        recipients_count: 0,
        sent_count: 0,
        failed_count: 0,
        created_at: new Date().toISOString(),
      };
      localBroadcasts.push(newBroadcast);
      return newBroadcast;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<Broadcast>(BROADCASTS_ENDPOINT, data);
    } catch {
      return createLocal();
    }
  },

  /**
   * Обновить рассылку
   */
  async update(id: number, data: BroadcastUpdate): Promise<Broadcast> {
    const updateLocal = (): Broadcast => {
      const index = localBroadcasts.findIndex(b => b.id === id);
      if (index !== -1) {
        localBroadcasts[index] = {
          ...localBroadcasts[index],
          ...data,
        };
        return localBroadcasts[index] as Broadcast;
      }
      return localBroadcasts[0] as Broadcast;
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.patch<Broadcast>(`${BROADCASTS_ENDPOINT}/${id}`, data);
    } catch {
      return updateLocal();
    }
  },

  /**
   * Удалить рассылку
   */
  async delete(id: number): Promise<void> {
    const deleteLocal = () => {
      localBroadcasts = localBroadcasts.filter(b => b.id !== id);
    };

    if (isDemoMode()) {
      deleteLocal();
      return;
    }
    try {
      await api.delete<void>(`${BROADCASTS_ENDPOINT}/${id}`);
    } catch {
      deleteLocal();
    }
  },

  /**
   * Отправить рассылку немедленно
   */
  async send(id: number): Promise<Broadcast> {
    const sendLocal = (): Broadcast => {
      const index = localBroadcasts.findIndex(b => b.id === id);
      if (index !== -1) {
        localBroadcasts[index] = {
          ...localBroadcasts[index],
          status: 'SENT',
          sent_at: new Date().toISOString(),
          recipients_count: 50,
          sent_count: 48,
          failed_count: 2,
        };
        return localBroadcasts[index] as Broadcast;
      }
      return localBroadcasts[0] as Broadcast;
    };

    if (isDemoMode()) {
      return sendLocal();
    }
    try {
      return await api.post<Broadcast>(`${BROADCASTS_ENDPOINT}/${id}/send`);
    } catch {
      return sendLocal();
    }
  },

  /**
   * Отменить запланированную рассылку
   */
  async cancel(id: number): Promise<Broadcast> {
    const cancelLocal = (): Broadcast => {
      const index = localBroadcasts.findIndex(b => b.id === id);
      if (index !== -1) {
        localBroadcasts[index] = {
          ...localBroadcasts[index],
          status: 'CANCELLED',
        };
        return localBroadcasts[index] as Broadcast;
      }
      return localBroadcasts[0] as Broadcast;
    };

    if (isDemoMode()) {
      return cancelLocal();
    }
    try {
      return await api.post<Broadcast>(`${BROADCASTS_ENDPOINT}/${id}/cancel`);
    } catch {
      return cancelLocal();
    }
  },

  /**
   * Получить статистику рассылок
   */
  async getStats(): Promise<BroadcastStats> {
    if (isDemoMode()) {
      return mockData.broadcastsStats as BroadcastStats;
    }
    try {
      return await api.get<BroadcastStats>(`${BROADCASTS_ENDPOINT}/stats`);
    } catch {
      return mockData.broadcastsStats as BroadcastStats;
    }
  },
};
