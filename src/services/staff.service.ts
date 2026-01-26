import { api, isDemoMode } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import type {
  Staff,
  StaffCreate,
  StaffUpdate,
  StaffListParams,
  StaffListResponse,
  StaffTodayStats,
} from '@/types';

// Локальное состояние для демо
let localStaff: Staff[] = [...mockData.staff.items] as unknown as Staff[];

export const staffService = {
  async getStaff(params?: StaffListParams): Promise<StaffListResponse> {
    const getLocal = (): StaffListResponse => {
      let items = [...localStaff];

      if (params?.is_active !== undefined) {
        items = items.filter(s => s.is_active === params.is_active);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        items = items.filter(s =>
          s.name.toLowerCase().includes(search) ||
          s.specialization?.toLowerCase().includes(search)
        );
      }

      const skip = params?.skip || 0;
      const limit = params?.limit || 50;

      return {
        items: items.slice(skip, skip + limit) as Staff[],
        total: items.length,
        skip,
        limit,
      };
    };

    // Всегда пытаемся получить реальные данные из синхронизации
    try {
      const response = await api.get<StaffListResponse>('/v1/admin/staff', params);
      if (response.items && response.items.length > 0) {
        return response;
      }
      if (isDemoMode()) {
        return getLocal();
      }
      return response;
    } catch {
      return getLocal();
    }
  },

  async getStaffMember(id: number): Promise<Staff> {
    const getLocal = (): Staff => {
      const staff = localStaff.find(s => s.id === id);
      return (staff || localStaff[0]) as Staff;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<Staff>(`/v1/admin/staff/${id}`);
    } catch {
      return getLocal();
    }
  },

  async createStaffMember(data: StaffCreate): Promise<Staff> {
    const createLocal = (): Staff => {
      const maxId = Math.max(...localStaff.map(s => s.id), 0);
      const newStaff = {
        id: maxId + 1,
        yclients_id: `staff_new_${Date.now()}`,
        ...data,
        is_active: true,
        appointments_count: 0,
        rating: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStaff.push(newStaff);
      return newStaff as Staff;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<Staff>('/v1/admin/staff', data);
    } catch {
      return createLocal();
    }
  },

  async updateStaffMember(id: number, data: StaffUpdate): Promise<Staff> {
    const updateLocal = (): Staff => {
      const index = localStaff.findIndex(s => s.id === id);
      if (index !== -1) {
        localStaff[index] = {
          ...localStaff[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        return localStaff[index] as Staff;
      }
      return localStaff[0] as Staff;
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.put<Staff>(`/v1/admin/staff/${id}`, data);
    } catch {
      return updateLocal();
    }
  },

  async deleteStaffMember(id: number): Promise<void> {
    const deleteLocal = () => {
      localStaff = localStaff.filter(s => s.id !== id);
    };

    if (isDemoMode()) {
      deleteLocal();
      return;
    }
    try {
      await api.delete(`/v1/admin/staff/${id}`);
    } catch {
      deleteLocal();
    }
  },

  async getTodayStats(): Promise<StaffTodayStats> {
    // Всегда пытаемся получить реальные данные
    try {
      const response = await api.get<StaffTodayStats>('/v1/admin/staff/today-stats');
      if (response && response.total !== undefined) {
        return response;
      }
      if (isDemoMode()) {
        return mockData.staffTodayStats as StaffTodayStats;
      }
      return response;
    } catch {
      return mockData.staffTodayStats as StaffTodayStats;
    }
  },

  async toggleActive(id: number, isActive: boolean): Promise<Staff> {
    const toggleLocal = (): Staff => {
      const index = localStaff.findIndex(s => s.id === id);
      if (index !== -1) {
        localStaff[index] = {
          ...localStaff[index],
          is_active: isActive,
          updated_at: new Date().toISOString(),
        };
        return localStaff[index] as Staff;
      }
      return localStaff[0] as Staff;
    };

    if (isDemoMode()) {
      return toggleLocal();
    }
    try {
      return await api.put<Staff>(`/v1/admin/staff/${id}/toggle-active`, { is_active: isActive });
    } catch {
      return toggleLocal();
    }
  },

  async syncFromYclients(): Promise<{ synced: number; created: number; updated: number }> {
    if (isDemoMode()) {
      return { synced: 5, created: 1, updated: 4 };
    }
    try {
      return await api.post('/v1/admin/staff/sync-yclients');
    } catch {
      return { synced: 0, created: 0, updated: 0 };
    }
  },

  async getSchedule(id: number, date: string): Promise<{ slots: string[] }> {
    const getLocal = (): { slots: string[] } => {
      return {
        slots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
      };
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get(`/v1/admin/staff/${id}/schedule`, { date });
    } catch {
      return getLocal();
    }
  },
};
