import { api } from '@/lib/api';
import type {
  Salon,
  SalonCreate,
  SalonUpdate,
  SalonsListParams,
  SalonsListResponse,
  SuperadminStats,
} from '@/types';

export const salonsService = {
  // Get list of salons (superadmin only)
  async getSalons(params?: SalonsListParams): Promise<SalonsListResponse> {
    return api.get<SalonsListResponse, SalonsListParams>('/v1/superadmin/salons', params);
  },

  // Get single salon by ID
  async getSalon(id: number): Promise<Salon> {
    return api.get<Salon>(`/v1/superadmin/salons/${id}`);
  },

  // Create new salon
  async createSalon(data: SalonCreate): Promise<Salon> {
    return api.post<Salon>('/v1/superadmin/salons', data);
  },

  // Update salon
  async updateSalon(id: number, data: SalonUpdate): Promise<Salon> {
    return api.patch<Salon>(`/v1/superadmin/salons/${id}`, data);
  },

  // Activate salon
  async activateSalon(id: number): Promise<Salon> {
    return api.post<Salon>(`/v1/superadmin/salons/${id}/activate`);
  },

  // Suspend salon
  async suspendSalon(id: number): Promise<Salon> {
    return api.post<Salon>(`/v1/superadmin/salons/${id}/suspend`);
  },

  // Delete salon
  async deleteSalon(id: number): Promise<void> {
    return api.delete(`/v1/superadmin/salons/${id}`);
  },

  // Get superadmin statistics
  async getStats(): Promise<SuperadminStats> {
    return api.get<SuperadminStats>('/v1/superadmin/stats');
  },

  // Extend trial for salon
  async extendTrial(id: number, days: number): Promise<Salon> {
    return api.post<Salon>(`/v1/superadmin/salons/${id}/extend-trial`, { days });
  },
};
