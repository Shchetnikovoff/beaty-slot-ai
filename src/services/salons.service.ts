import { api, isDemoMode } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import type {
  Salon,
  SalonCreate,
  SalonUpdate,
  SalonsListParams,
  SalonsListResponse,
  SuperadminStats,
} from '@/types';

// Локальное состояние для демо
let localSalons: Salon[] = [...mockData.salons.items] as unknown as Salon[];

export const salonsService = {
  // Get list of salons (superadmin only)
  async getSalons(params?: SalonsListParams): Promise<SalonsListResponse> {
    const getLocal = (): SalonsListResponse => {
      let items = [...localSalons];

      if (params?.is_active !== undefined) {
        items = items.filter(s => s.is_active === params.is_active);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        items = items.filter(s =>
          s.name.toLowerCase().includes(search) ||
          s.address?.toLowerCase().includes(search)
        );
      }

      const skip = params?.skip || 0;
      const limit = params?.limit || 50;

      return {
        items: items.slice(skip, skip + limit) as Salon[],
        total: items.length,
        skip,
        limit,
      };
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<SalonsListResponse, SalonsListParams>('/v1/superadmin/salons', params);
    } catch {
      return getLocal();
    }
  },

  // Get single salon by ID
  async getSalon(id: number): Promise<Salon> {
    const getLocal = (): Salon => {
      const salon = localSalons.find(s => s.id === id);
      return (salon || localSalons[0]) as Salon;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<Salon>(`/v1/superadmin/salons/${id}`);
    } catch {
      return getLocal();
    }
  },

  // Create new salon
  async createSalon(data: SalonCreate): Promise<Salon> {
    const createLocal = (): Salon => {
      const maxId = Math.max(...localSalons.map(s => s.id), 0);
      const newSalon: Salon = {
        id: maxId + 1,
        yclients_company_id: data.yclients_company_id,
        name: data.name,
        description: data.description,
        phone: data.phone,
        email: data.email,
        address: data.address,
        timezone: data.timezone || 'Europe/Moscow',
        is_active: true,
        status: 'TRIAL',
        enabled_features: [],
        limits: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localSalons.push(newSalon);
      return newSalon;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<Salon>('/v1/superadmin/salons', data);
    } catch {
      return createLocal();
    }
  },

  // Update salon
  async updateSalon(id: number, data: SalonUpdate): Promise<Salon> {
    const updateLocal = (): Salon => {
      const index = localSalons.findIndex(s => s.id === id);
      if (index !== -1) {
        localSalons[index] = {
          ...localSalons[index],
          ...data,
        };
        return localSalons[index] as Salon;
      }
      return localSalons[0] as Salon;
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.patch<Salon>(`/v1/superadmin/salons/${id}`, data);
    } catch {
      return updateLocal();
    }
  },

  // Activate salon
  async activateSalon(id: number): Promise<Salon> {
    const activateLocal = (): Salon => {
      const index = localSalons.findIndex(s => s.id === id);
      if (index !== -1) {
        localSalons[index] = {
          ...localSalons[index],
          is_active: true,
          status: 'ACTIVE',
        };
        return localSalons[index] as Salon;
      }
      return localSalons[0] as Salon;
    };

    if (isDemoMode()) {
      return activateLocal();
    }
    try {
      return await api.post<Salon>(`/v1/superadmin/salons/${id}/activate`);
    } catch {
      return activateLocal();
    }
  },

  // Suspend salon
  async suspendSalon(id: number): Promise<Salon> {
    const suspendLocal = (): Salon => {
      const index = localSalons.findIndex(s => s.id === id);
      if (index !== -1) {
        localSalons[index] = {
          ...localSalons[index],
          is_active: false,
          status: 'SUSPENDED',
        };
        return localSalons[index] as Salon;
      }
      return localSalons[0] as Salon;
    };

    if (isDemoMode()) {
      return suspendLocal();
    }
    try {
      return await api.post<Salon>(`/v1/superadmin/salons/${id}/suspend`);
    } catch {
      return suspendLocal();
    }
  },

  // Delete salon
  async deleteSalon(id: number): Promise<void> {
    const deleteLocal = () => {
      localSalons = localSalons.filter(s => s.id !== id);
    };

    if (isDemoMode()) {
      deleteLocal();
      return;
    }
    try {
      await api.delete(`/v1/superadmin/salons/${id}`);
    } catch {
      deleteLocal();
    }
  },

  // Get superadmin statistics
  async getStats(): Promise<SuperadminStats> {
    if (isDemoMode()) {
      return mockData.superadminStats as unknown as SuperadminStats;
    }
    try {
      return await api.get<SuperadminStats>('/v1/superadmin/stats');
    } catch {
      return mockData.superadminStats as unknown as SuperadminStats;
    }
  },

  // Extend trial for salon
  async extendTrial(id: number, days: number): Promise<Salon> {
    const extendLocal = (): Salon => {
      const index = localSalons.findIndex(s => s.id === id);
      if (index !== -1) {
        localSalons[index] = {
          ...localSalons[index],
          status: 'TRIAL',
        };
        return localSalons[index] as Salon;
      }
      return localSalons[0] as Salon;
    };

    if (isDemoMode()) {
      return extendLocal();
    }
    try {
      return await api.post<Salon>(`/v1/superadmin/salons/${id}/extend-trial`, { days });
    } catch {
      return extendLocal();
    }
  },
};
