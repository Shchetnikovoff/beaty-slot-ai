import { api } from '@/lib/api';
import type {
  Client,
  ClientCreate,
  ClientUpdate,
  ClientsListParams,
  ClientsListResponse,
} from '@/types';

export const clientsService = {
  async getClients(params?: ClientsListParams): Promise<ClientsListResponse> {
    return api.get<ClientsListResponse>('/v1/admin/clients', params);
  },

  async getClient(yclientsId: string): Promise<Client> {
    return api.get<Client>(`/v1/admin/clients/${yclientsId}`);
  },

  async createClient(data: ClientCreate): Promise<Client> {
    return api.post<Client>('/v1/clients', data);
  },

  async updateClient(yclientsId: string, data: ClientUpdate): Promise<Client> {
    return api.put<Client>(`/v1/admin/clients/${yclientsId}`, data);
  },

  async deleteClient(yclientsId: string): Promise<void> {
    return api.delete(`/v1/admin/clients/${yclientsId}`);
  },

  async toggleSubscription(yclientsId: string, activate: boolean): Promise<Client> {
    return api.put<Client>(`/v1/admin/clients/${yclientsId}/toggle-subscription`, {
      activate,
    });
  },

  async importFromYclients(): Promise<{ imported: number; updated: number }> {
    return api.post('/v1/admin/clients/import-from-yclients');
  },

  async syncClient(yclientsId: string): Promise<Client> {
    return api.put<Client>(`/v1/admin/clients/${yclientsId}/sync-yclients`);
  },

  async uploadPhoto(yclientsId: string, file: File): Promise<{ photo_url: string }> {
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
  },
};
