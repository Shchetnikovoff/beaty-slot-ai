import { api } from '@/lib/api';
import type {
  Staff,
  StaffCreate,
  StaffUpdate,
  StaffListParams,
  StaffListResponse,
  StaffTodayStats,
} from '@/types';

export const staffService = {
  async getStaff(params?: StaffListParams): Promise<StaffListResponse> {
    return api.get<StaffListResponse>('/v1/admin/staff', params);
  },

  async getStaffMember(id: number): Promise<Staff> {
    return api.get<Staff>(`/v1/admin/staff/${id}`);
  },

  async createStaffMember(data: StaffCreate): Promise<Staff> {
    return api.post<Staff>('/v1/admin/staff', data);
  },

  async updateStaffMember(id: number, data: StaffUpdate): Promise<Staff> {
    return api.put<Staff>(`/v1/admin/staff/${id}`, data);
  },

  async deleteStaffMember(id: number): Promise<void> {
    return api.delete(`/v1/admin/staff/${id}`);
  },

  async getTodayStats(): Promise<StaffTodayStats> {
    return api.get<StaffTodayStats>('/v1/admin/staff/today-stats');
  },

  async toggleActive(id: number, isActive: boolean): Promise<Staff> {
    return api.put<Staff>(`/v1/admin/staff/${id}/toggle-active`, { is_active: isActive });
  },

  async syncFromYclients(): Promise<{ synced: number; created: number; updated: number }> {
    return api.post('/v1/admin/staff/sync-yclients');
  },

  async getSchedule(id: number, date: string): Promise<{ slots: string[] }> {
    return api.get(`/v1/admin/staff/${id}/schedule`, { date });
  },
};
