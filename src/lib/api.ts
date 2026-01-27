import { mockData } from './mock-data';

// Если API_URL пустой или не задан — используем локальные API routes (/api/...)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type QueryParams = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  params?: QueryParams;
}

interface ApiError {
  message: string;
  status: number;
  detail?: string;
}

// Endpoints которые должны работать даже в demo режиме (используют локальные API routes)
// Эти endpoints всегда вызывают реальный API вместо возврата mock данных
const ALWAYS_REAL_ENDPOINTS = [
  '/v1/admin/sync',
  '/v1/admin/clients',
  '/v1/admin/staff',
  '/v1/admin/appointments',
  '/v1/admin/services',
  '/v1/admin/dashboard',
  '/v1/admin/broadcasts',
  '/v1/telegram',
];

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
        document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      } else {
        localStorage.removeItem('auth_token');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  }

  setUserRole(role: string | null) {
    if (typeof window !== 'undefined') {
      if (role) {
        document.cookie = `user_role=${role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      } else {
        document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  // Проверка демо-режима
  isDemoMode(): boolean {
    const token = this.getToken();
    // Демо-режим если: нет токена, токен начинается с 'demo-', или явно установлен DEMO_MODE
    if (!token) return true; // Без авторизации всегда демо
    return token.startsWith('demo-');
  }

  private buildUrl(endpoint: string, params?: QueryParams): string {
    // Для endpoints из ALWAYS_REAL_ENDPOINTS всегда используем локальные Next.js API routes
    // Это нужно чтобы данные шли через /api/v1/admin/... которые читают из sync-store
    const useLocalApi = this.isAlwaysRealEndpoint(endpoint);

    // Если baseUrl пустой или это локальный API endpoint — используем относительные URL
    const fullPath = (this.baseUrl && !useLocalApi) ? `${this.baseUrl}${endpoint}` : `/api${endpoint}`;

    if (!params || Object.keys(params).length === 0) {
      return fullPath;
    }

    // Для относительных URL нужно добавить параметры вручную
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${fullPath}?${queryString}` : fullPath;
  }

  // Проверить, является ли endpoint "всегда реальным" (не использовать mock данные)
  private isAlwaysRealEndpoint(endpoint: string): boolean {
    return ALWAYS_REAL_ENDPOINTS.some(prefix => endpoint.startsWith(prefix));
  }

  // Получение моковых данных по endpoint
  private getMockData<T>(endpoint: string, params?: QueryParams): T | null {
    // /v1/clients или /v1/admin/clients
    if (endpoint === '/v1/clients' || endpoint === '/v1/admin/clients') {
      return mockData.clients as T;
    }
    // /v1/clients/:id или /v1/admin/clients/:id
    if (endpoint.match(/^\/v1\/(admin\/)?clients\/[^/]+$/)) {
      const id = endpoint.split('/').pop();
      const client = mockData.clients.items.find(c => c.yclients_id === id);
      return (client || mockData.clients.items[0]) as T;
    }
    // /v1/payments или /v1/admin/payments
    if (endpoint === '/v1/payments' || endpoint === '/v1/admin/payments') {
      return mockData.payments as T;
    }
    // /v1/subscriptions или /v1/admin/subscriptions
    if (endpoint === '/v1/subscriptions' || endpoint === '/v1/admin/subscriptions') {
      return mockData.subscriptions as T;
    }
    // /v1/subscriptions/plans или /v1/admin/subscriptions/plans
    if (endpoint === '/v1/subscriptions/plans' || endpoint === '/v1/admin/subscriptions/plans') {
      return mockData.subscriptionPlans as T;
    }
    // /v1/documents или /v1/admin/documents
    if (endpoint === '/v1/documents' || endpoint === '/v1/admin/documents') {
      return mockData.documents as T;
    }
    // /v1/salons или /v1/admin/salons или /v1/superadmin/salons
    if (endpoint === '/v1/salons' || endpoint === '/v1/admin/salons' || endpoint === '/v1/superadmin/salons') {
      return mockData.salons as T;
    }
    // /v1/salons/stats или /v1/admin/salons/stats или /v1/superadmin/stats
    if (endpoint === '/v1/salons/stats' || endpoint === '/v1/admin/salons/stats' || endpoint === '/v1/superadmin/stats') {
      return mockData.superadminStats as T;
    }
    // /v1/auth/me
    if (endpoint === '/v1/auth/me') {
      return null; // Handled by auth service
    }
    // /v1/admin/staff
    if (endpoint === '/v1/admin/staff' || endpoint === '/v1/staff') {
      return mockData.staff as T;
    }
    // /v1/admin/staff/:id
    if (endpoint.match(/^\/v1\/(admin\/)?staff\/\d+$/)) {
      const id = Number(endpoint.split('/').pop());
      const staff = mockData.staff.items.find(s => s.id === id);
      return (staff || mockData.staff.items[0]) as T;
    }
    // /v1/admin/staff/today-stats
    if (endpoint === '/v1/admin/staff/today-stats' || endpoint === '/v1/staff/today-stats') {
      return mockData.staffTodayStats as T;
    }
    // /v1/admin/appointments
    if (endpoint === '/v1/admin/appointments' || endpoint === '/v1/appointments') {
      return mockData.appointments as T;
    }
    // /v1/admin/appointments/:id
    if (endpoint.match(/^\/v1\/(admin\/)?appointments\/\d+$/)) {
      const id = Number(endpoint.split('/').pop());
      const appointment = mockData.appointments.items.find(a => a.id === id);
      return (appointment || mockData.appointments.items[0]) as T;
    }
    // /v1/admin/appointments/today-stats
    if (endpoint === '/v1/admin/appointments/today-stats' || endpoint === '/v1/appointments/today-stats') {
      return mockData.appointmentsTodayStats as T;
    }
    // /v1/admin/appointments/stats (with date param)
    if (endpoint === '/v1/admin/appointments/stats' || endpoint === '/v1/appointments/stats') {
      return mockData.appointmentsTodayStats as T;
    }
    // /v1/admin/broadcasts
    if (endpoint === '/v1/admin/broadcasts' || endpoint === '/v1/broadcasts') {
      return mockData.broadcasts as T;
    }
    // /v1/admin/broadcasts/stats
    if (endpoint === '/v1/admin/broadcasts/stats' || endpoint === '/v1/broadcasts/stats') {
      return mockData.broadcastsStats as T;
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = options;

    // Некоторые endpoints всегда используют реальные API routes (sync, etc.)
    const useRealApi = this.isAlwaysRealEndpoint(endpoint);

    // В демо-режиме возвращаем моковые данные для GET запросов
    // НО не для endpoints которые должны всегда использовать реальный API
    if (this.isDemoMode() && method === 'GET' && !useRealApi) {
      const mockResult = this.getMockData<T>(endpoint, params);
      if (mockResult !== null) {
        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('[Demo Mode] Returning mock data for:', endpoint);
        return mockResult;
      }
      console.warn('[Demo Mode] No mock data for endpoint:', endpoint);
    }

    const token = this.getToken();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token && !token.startsWith('demo-')) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(this.buildUrl(endpoint, params), {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store', // Отключаем кэширование для получения свежих данных
      });

      if (!response.ok) {
        const error: ApiError = {
          message: 'Request failed',
          status: response.status,
        };

        try {
          const errorData = await response.json();
          error.message = errorData.detail || errorData.message || 'Request failed';
          error.detail = errorData.detail;
        } catch {
          error.message = response.statusText || 'Request failed';
        }

        if (response.status === 401) {
          this.setToken(null);
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
        }

        throw error;
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      // Если API недоступен и мы в демо-режиме, возвращаем моковые данные
      if (this.isDemoMode() && error instanceof TypeError) {
        const mockResult = this.getMockData<T>(endpoint, params);
        if (mockResult !== null) {
          return mockResult;
        }
      }
      throw error;
    }
  }

  async get<T, P extends QueryParams = QueryParams>(endpoint: string, params?: P): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params: params as QueryParams });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
export const isDemoMode = () => api.isDemoMode();
export type { ApiError };
