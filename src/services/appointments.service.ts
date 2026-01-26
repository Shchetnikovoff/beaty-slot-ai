import { api, isDemoMode } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import type {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentsListParams,
  AppointmentsListResponse,
  AppointmentsTodayStats,
} from '@/types';

// Локальное состояние для демо
let localAppointments: Appointment[] = [...mockData.appointments.items] as Appointment[];

export const appointmentsService = {
  async getAppointments(params?: AppointmentsListParams): Promise<AppointmentsListResponse> {
    const getLocal = (): AppointmentsListResponse => {
      let items = [...localAppointments];

      if (params?.status) {
        items = items.filter(a => a.status === params.status);
      }
      if (params?.staff_id) {
        items = items.filter(a => a.staff_id === params.staff_id);
      }
      if (params?.date) {
        const dateStr = String(params.date);
        items = items.filter(a => a.scheduled_at.startsWith(dateStr));
      }

      const skip = params?.skip || 0;
      const limit = params?.limit || 50;

      return {
        items: items.slice(skip, skip + limit) as Appointment[],
        total: items.length,
        skip,
        limit,
      };
    };

    // Всегда пытаемся получить реальные данные из синхронизации
    try {
      const response = await api.get<AppointmentsListResponse>('/v1/admin/appointments', params);
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

  async getAppointment(id: number): Promise<Appointment> {
    const getLocal = (): Appointment => {
      const appointment = localAppointments.find(a => a.id === id);
      return (appointment || localAppointments[0]) as Appointment;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<Appointment>(`/v1/admin/appointments/${id}`);
    } catch {
      return getLocal();
    }
  },

  async createAppointment(data: AppointmentCreate): Promise<Appointment> {
    const createLocal = (): Appointment => {
      const maxId = Math.max(...localAppointments.map(a => a.id), 0);
      const newAppointment: Appointment = {
        id: maxId + 1,
        client_id: data.client_id,
        staff_id: data.staff_id,
        service_id: data.service_id,
        service_name: data.service_name,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes,
        price: data.price,
        comment: data.comment,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: { name: 'Новый клиент', phone: '+7 (000) 000-00-00' },
        staff: { name: 'Мастер' },
      };
      localAppointments.push(newAppointment);
      return newAppointment;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<Appointment>('/v1/admin/appointments', data);
    } catch {
      return createLocal();
    }
  },

  async updateAppointment(id: number, data: AppointmentUpdate): Promise<Appointment> {
    const updateLocal = (): Appointment => {
      const index = localAppointments.findIndex(a => a.id === id);
      if (index !== -1) {
        localAppointments[index] = {
          ...localAppointments[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        return localAppointments[index] as Appointment;
      }
      return localAppointments[0] as Appointment;
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.put<Appointment>(`/v1/admin/appointments/${id}`, data);
    } catch {
      return updateLocal();
    }
  },

  async deleteAppointment(id: number): Promise<void> {
    const deleteLocal = () => {
      localAppointments = localAppointments.filter(a => a.id !== id);
    };

    if (isDemoMode()) {
      deleteLocal();
      return;
    }
    try {
      await api.delete(`/v1/admin/appointments/${id}`);
    } catch {
      deleteLocal();
    }
  },

  async getTodayStats(): Promise<AppointmentsTodayStats> {
    // Всегда пытаемся получить реальные данные
    try {
      const response = await api.get<AppointmentsTodayStats>('/v1/admin/appointments/today-stats');
      if (response && response.total !== undefined) {
        return response;
      }
      if (isDemoMode()) {
        return mockData.appointmentsTodayStats as AppointmentsTodayStats;
      }
      return response;
    } catch {
      return mockData.appointmentsTodayStats as AppointmentsTodayStats;
    }
  },

  async getStats(date: string): Promise<AppointmentsTodayStats> {
    // Всегда пытаемся получить реальные данные
    try {
      const response = await api.get<AppointmentsTodayStats>('/v1/admin/appointments/stats', { date });
      if (response && response.total !== undefined) {
        return response;
      }
      if (isDemoMode()) {
        return mockData.appointmentsTodayStats as AppointmentsTodayStats;
      }
      return response;
    } catch {
      return mockData.appointmentsTodayStats as AppointmentsTodayStats;
    }
  },

  async confirm(id: number): Promise<Appointment> {
    const confirmLocal = (): Appointment => {
      const index = localAppointments.findIndex(a => a.id === id);
      if (index !== -1) {
        localAppointments[index] = {
          ...localAppointments[index],
          status: 'CONFIRMED',
          updated_at: new Date().toISOString(),
        };
        return localAppointments[index] as Appointment;
      }
      return localAppointments[0] as Appointment;
    };

    if (isDemoMode()) {
      return confirmLocal();
    }
    try {
      return await api.post<Appointment>(`/v1/admin/appointments/${id}/confirm`);
    } catch {
      return confirmLocal();
    }
  },

  async cancel(id: number, reason?: string): Promise<Appointment> {
    const cancelLocal = (): Appointment => {
      const index = localAppointments.findIndex(a => a.id === id);
      if (index !== -1) {
        localAppointments[index] = {
          ...localAppointments[index],
          status: 'CANCELLED',
          comment: reason,
          updated_at: new Date().toISOString(),
        };
        return localAppointments[index] as Appointment;
      }
      return localAppointments[0] as Appointment;
    };

    if (isDemoMode()) {
      return cancelLocal();
    }
    try {
      return await api.post<Appointment>(`/v1/admin/appointments/${id}/cancel`, { reason });
    } catch {
      return cancelLocal();
    }
  },

  async complete(id: number): Promise<Appointment> {
    const completeLocal = (): Appointment => {
      const index = localAppointments.findIndex(a => a.id === id);
      if (index !== -1) {
        localAppointments[index] = {
          ...localAppointments[index],
          status: 'COMPLETED',
          updated_at: new Date().toISOString(),
        };
        return localAppointments[index] as Appointment;
      }
      return localAppointments[0] as Appointment;
    };

    if (isDemoMode()) {
      return completeLocal();
    }
    try {
      return await api.post<Appointment>(`/v1/admin/appointments/${id}/complete`);
    } catch {
      return completeLocal();
    }
  },

  async markNoShow(id: number): Promise<Appointment> {
    const noShowLocal = (): Appointment => {
      const index = localAppointments.findIndex(a => a.id === id);
      if (index !== -1) {
        localAppointments[index] = {
          ...localAppointments[index],
          status: 'NO_SHOW',
          updated_at: new Date().toISOString(),
        };
        return localAppointments[index] as Appointment;
      }
      return localAppointments[0] as Appointment;
    };

    if (isDemoMode()) {
      return noShowLocal();
    }
    try {
      return await api.post<Appointment>(`/v1/admin/appointments/${id}/no-show`);
    } catch {
      return noShowLocal();
    }
  },

  async syncFromYclients(): Promise<{ synced: number; created: number; updated: number }> {
    if (isDemoMode()) {
      return { synced: 10, created: 3, updated: 7 };
    }
    try {
      return await api.post('/v1/admin/appointments/sync-yclients');
    } catch {
      return { synced: 0, created: 0, updated: 0 };
    }
  },
};
