import { api } from '@/lib/api';
import type {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentsListParams,
  AppointmentsListResponse,
  AppointmentsTodayStats,
} from '@/types';

export const appointmentsService = {
  async getAppointments(params?: AppointmentsListParams): Promise<AppointmentsListResponse> {
    return api.get<AppointmentsListResponse>('/v1/admin/appointments', params);
  },

  async getAppointment(id: number): Promise<Appointment> {
    return api.get<Appointment>(`/v1/admin/appointments/${id}`);
  },

  async createAppointment(data: AppointmentCreate): Promise<Appointment> {
    return api.post<Appointment>('/v1/admin/appointments', data);
  },

  async updateAppointment(id: number, data: AppointmentUpdate): Promise<Appointment> {
    return api.put<Appointment>(`/v1/admin/appointments/${id}`, data);
  },

  async deleteAppointment(id: number): Promise<void> {
    return api.delete(`/v1/admin/appointments/${id}`);
  },

  async getTodayStats(): Promise<AppointmentsTodayStats> {
    return api.get<AppointmentsTodayStats>('/v1/admin/appointments/today-stats');
  },

  async getStats(date: string): Promise<AppointmentsTodayStats> {
    return api.get<AppointmentsTodayStats>('/v1/admin/appointments/stats', { date });
  },

  async confirm(id: number): Promise<Appointment> {
    return api.post<Appointment>(`/v1/admin/appointments/${id}/confirm`);
  },

  async cancel(id: number, reason?: string): Promise<Appointment> {
    return api.post<Appointment>(`/v1/admin/appointments/${id}/cancel`, { reason });
  },

  async complete(id: number): Promise<Appointment> {
    return api.post<Appointment>(`/v1/admin/appointments/${id}/complete`);
  },

  async markNoShow(id: number): Promise<Appointment> {
    return api.post<Appointment>(`/v1/admin/appointments/${id}/no-show`);
  },

  async syncFromYclients(): Promise<{ synced: number; created: number; updated: number }> {
    return api.post('/v1/admin/appointments/sync-yclients');
  },
};
