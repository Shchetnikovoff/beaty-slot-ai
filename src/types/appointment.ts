export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: number;
  client_id: string;
  staff_id: number;
  service_id?: number;
  service_name: string;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  client?: { name: string; phone: string };
  staff?: { name: string };
}

export interface AppointmentCreate {
  client_id: string;
  staff_id: number;
  service_id?: number;
  service_name: string;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  comment?: string;
}

export interface AppointmentUpdate {
  status?: AppointmentStatus;
  scheduled_at?: string;
  duration_minutes?: number;
  price?: number;
  comment?: string;
}

export interface AppointmentsListParams {
  [key: string]: string | number | boolean | undefined;
  skip?: number;
  limit?: number;
  status?: AppointmentStatus;
  staff_id?: number;
  client_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface AppointmentsListResponse {
  items: Appointment[];
  total: number;
  skip: number;
  limit: number;
}

export interface AppointmentsTodayStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  no_show: number;
  completed: number;
}
