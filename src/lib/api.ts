const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
      } else {
        localStorage.removeItem('auth_token');
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

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = options;
    const token = this.getToken();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.buildUrl(endpoint, params), {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
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
export type { ApiError };
