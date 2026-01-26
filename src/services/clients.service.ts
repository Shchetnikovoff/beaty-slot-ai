import { api, isDemoMode } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import type {
  Client,
  ClientCreate,
  ClientUpdate,
  ClientsListParams,
  ClientsListResponse,
} from '@/types';

// Локальное состояние для демо
let localClients: Client[] = [...mockData.clients.items] as Client[];

export const clientsService = {
  async getClients(params?: ClientsListParams): Promise<ClientsListResponse> {
    const getLocal = (): ClientsListResponse => {
      let items = [...localClients];

      // Apply search filter
      if (params?.search) {
        const search = params.search.toLowerCase();
        items = items.filter(c =>
          c.name.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          c.email?.toLowerCase().includes(search)
        );
      }

      // Apply subscription filter
      if (params?.has_subscription !== undefined) {
        items = items.filter(c => c.has_active_subscription === params.has_subscription);
      }

      // Apply client_status filter (VIP, PROBLEM, LOST, etc.)
      if (params?.client_status && params.client_status !== 'ALL') {
        items = items.filter(c => c.client_status === params.client_status);
      }

      // Apply risk_level filter
      if (params?.risk_level) {
        // Фильтруем по уровню риска и выше
        const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const minRiskIndex = riskLevels.indexOf(params.risk_level as string);
        if (minRiskIndex >= 0) {
          items = items.filter(c => {
            const clientRiskIndex = riskLevels.indexOf(c.risk_level);
            return clientRiskIndex >= minRiskIndex;
          });
        }
      }

      // Apply no_show filter (клиенты с неявками)
      if (params?.max_no_shows !== undefined && params.max_no_shows > 0) {
        items = items.filter(c => c.no_show_count > 0);
      }

      // Apply min_score filter
      if (params?.min_score !== undefined) {
        items = items.filter(c => c.score >= (params.min_score as number));
      }

      // Apply min_visits filter
      if (params?.min_visits !== undefined) {
        items = items.filter(c => c.visits_count >= (params.min_visits as number));
      }

      // Apply days_inactive filter
      if (params?.days_inactive !== undefined) {
        items = items.filter(c => {
          if (!c.days_since_last_visit) return false;
          return c.days_since_last_visit >= (params.days_inactive as number);
        });
      }

      // Apply is_blocked filter
      if (params?.is_blocked !== undefined) {
        items = items.filter(c => c.is_blocked === params.is_blocked);
      }

      const skip = params?.skip || 0;
      const limit = params?.limit || 50;

      return {
        items: items.slice(skip, skip + limit) as Client[],
        total: items.length,
        skip,
        limit,
      };
    };

    // Всегда пытаемся получить реальные данные из синхронизации
    // Fallback на мок только если API вернул пустой массив или ошибку
    try {
      const response = await api.get<ClientsListResponse>('/v1/admin/clients', params);
      // Если есть реальные данные - возвращаем их
      if (response.items && response.items.length > 0) {
        return response;
      }
      // Если данные пустые и мы в demo mode - используем моки
      if (isDemoMode()) {
        return getLocal();
      }
      return response;
    } catch {
      // Fallback на локальные данные при ошибке
      return getLocal();
    }
  },

  async getClient(yclientsId: string): Promise<Client> {
    const getLocal = (): Client => {
      const client = localClients.find(c => c.yclients_id === yclientsId);
      return (client || localClients[0]) as Client;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<Client>(`/v1/admin/clients/${yclientsId}`);
    } catch {
      return getLocal();
    }
  },

  async createClient(data: ClientCreate): Promise<Client> {
    const createLocal = (): Client => {
      const maxId = Math.max(...localClients.map(c => c.id), 0);
      const newClient: Client = {
        id: maxId + 1,
        yclients_id: `new_${Date.now()}`,
        phone: data.phone || '',
        name: data.name || '',
        email: data.email,
        is_blocked: false,
        has_uploaded_photo: false,
        role: 'USER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_visit_at: undefined,
        has_active_subscription: false,
        visits_count: 0,
        no_show_count: 0,
        total_spent: 0,
        score: 50,
        risk_level: 'MEDIUM',
        client_status: 'REGULAR',
        days_since_last_visit: undefined,
      };
      localClients.push(newClient);
      return newClient;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<Client>('/v1/clients', data);
    } catch {
      return createLocal();
    }
  },

  async updateClient(yclientsId: string, data: ClientUpdate): Promise<Client> {
    const updateLocal = (): Client => {
      const index = localClients.findIndex(c => c.yclients_id === yclientsId);
      if (index !== -1) {
        localClients[index] = {
          ...localClients[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        return localClients[index] as Client;
      }
      return localClients[0] as Client;
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.put<Client>(`/v1/admin/clients/${yclientsId}`, data);
    } catch {
      return updateLocal();
    }
  },

  async deleteClient(yclientsId: string): Promise<void> {
    const deleteLocal = () => {
      localClients = localClients.filter(c => c.yclients_id !== yclientsId);
    };

    if (isDemoMode()) {
      deleteLocal();
      return;
    }
    try {
      await api.delete(`/v1/admin/clients/${yclientsId}`);
    } catch {
      deleteLocal();
    }
  },

  async toggleSubscription(yclientsId: string, activate: boolean): Promise<Client> {
    const toggleLocal = (): Client => {
      const index = localClients.findIndex(c => c.yclients_id === yclientsId);
      if (index !== -1) {
        localClients[index] = {
          ...localClients[index],
          has_active_subscription: activate,
          updated_at: new Date().toISOString(),
        };
        return localClients[index] as Client;
      }
      return localClients[0] as Client;
    };

    if (isDemoMode()) {
      return toggleLocal();
    }
    try {
      return await api.put<Client>(`/v1/admin/clients/${yclientsId}/toggle-subscription`, {
        activate,
      });
    } catch {
      return toggleLocal();
    }
  },

  async importFromYclients(): Promise<{ imported: number; updated: number }> {
    if (isDemoMode()) {
      return { imported: 5, updated: 12 };
    }
    try {
      return await api.post('/v1/admin/clients/import-from-yclients');
    } catch {
      return { imported: 0, updated: 0 };
    }
  },

  async syncClient(yclientsId: string): Promise<Client> {
    const syncLocal = (): Client => {
      const client = localClients.find(c => c.yclients_id === yclientsId);
      return (client || localClients[0]) as Client;
    };

    if (isDemoMode()) {
      return syncLocal();
    }
    try {
      return await api.put<Client>(`/v1/admin/clients/${yclientsId}/sync-yclients`);
    } catch {
      return syncLocal();
    }
  },

  async uploadPhoto(yclientsId: string, file: File): Promise<{ photo_url: string }> {
    const uploadLocal = (): { photo_url: string } => {
      const url = URL.createObjectURL(file);
      const index = localClients.findIndex(c => c.yclients_id === yclientsId);
      if (index !== -1) {
        localClients[index].has_uploaded_photo = true;
      }
      return { photo_url: url };
    };

    if (isDemoMode()) {
      return uploadLocal();
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = api.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/admin/clients/${yclientsId}/photo/upload`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      return response.json();
    } catch {
      return uploadLocal();
    }
  },
};
