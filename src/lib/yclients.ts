/**
 * YClients API Client
 * Документация: https://api.yclients.com/api/v1/
 */

// Типы для YClients API
export interface YclientsClient {
  id: number;
  name: string;
  phone: string;
  email: string;
  sex_id: number;
  sex: string;
  importance_id: number;
  importance: string;
  discount: number;
  first_visit_date: string | null;
  last_visit_date: string | null;
  sold_amount: number;
  visit_count: number;
  avg_sum: number;
  balance: number;
  spent: number;
  paid: number;
  birth_date: string | null;
  comment: string;
  categories: { id: number; title: string }[];
  custom_fields: Record<string, unknown>;
}

export interface YclientsRecord {
  id: number;
  company_id: number;
  staff_id: number;
  services: {
    id: number;
    title: string;
    cost: number;
    cost_per_unit: number;
    first_cost: number;
    amount: number;
  }[];
  client: {
    id: number;
    name: string;
    phone: string;
    email: string;
  } | null;
  date: string;
  datetime: string;
  create_date: string;
  comment: string;
  online: boolean;
  visit_attendance: number;
  attendance: number;
  confirmed: number;
  seance_length: number;
  length: number;
  sms_before: number;
  sms_now: number;
  sms_now_text: string;
  email_now: number;
  notified: number;
  master_request: number;
  api_id: string;
  from_url: string;
  review_requested: number;
  visit_id: number;
  created_user_id: number;
  deleted: boolean;
  paid_full: number;
  last_change_date: string;
  custom_color: string;
  custom_font_color: string;
  record_labels: string[];
  activity_id: number;
  prepaid: string;
  prepaid_confirmed: boolean;
  last_status_change_date: string;
}

export interface YclientsStaff {
  id: number;
  name: string;
  specialization: string;
  position: { id: number; title: string };
  avatar: string;
  avatar_big: string;
  rating: number;
  votes_count: number;
  show_rating: number;
  comments_count: number;
  bookable: boolean;
  status: number;
  hidden: number;
  fired: number;
  user_id: number;
}

export interface YclientsService {
  id: number;
  title: string;
  category_id: number;
  price_min: number;
  price_max: number;
  discount: number;
  comment: string;
  weight: number;
  active: number;
  sex: number;
  image: string;
  prepaid: string;
  seance_length: number;
  booking_title: string;
}

export interface YclientsApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    total_count?: number;
  };
}

class YclientsAPI {
  // Ленивое чтение конфигурации - читаем при каждом запросе
  private get apiUrl(): string {
    return process.env.YCLIENTS_API_URL || 'https://api.yclients.com/api/v1';
  }

  // Bearer токен партнёра
  private get bearerToken(): string {
    return process.env.YCLIENTS_BEARER_TOKEN || '';
  }

  // User токен (предварительно полученный)
  private get userToken(): string {
    return process.env.YCLIENTS_USER_TOKEN || '';
  }

  private get companyId(): string {
    return process.env.YCLIENTS_COMPANY_ID || '';
  }

  private getHeaders(): Record<string, string> {
    // Проверяем что токены настроены
    if (!this.bearerToken) {
      throw new Error('YCLIENTS_BEARER_TOKEN не настроен в переменных окружения');
    }
    if (!this.userToken) {
      throw new Error('YCLIENTS_USER_TOKEN не настроен в переменных окружения');
    }

    console.log('[YClients] Используем токены (bearer:', this.bearerToken.substring(0, 8) + '..., user:', this.userToken.substring(0, 8) + '...)');

    return {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.api.v2+json',
      'Authorization': `Bearer ${this.bearerToken}, User ${this.userToken}`,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<YclientsApiResponse<T>> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YClients API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Получить список клиентов компании (через search endpoint)
   * Yclients требует POST запрос к /clients/search
   */
  async getClients(params?: {
    page?: number;
    count?: number;
    fullname?: string;
    phone?: string;
  }): Promise<YclientsClient[]> {
    const endpoint = `/company/${this.companyId}/clients/search`;

    const body = {
      page: params?.page || 1,
      page_size: params?.count || 100,
      // Запрашиваем ВСЕ поля необходимые для расчёта ИВК
      fields: [
        'id', 'name', 'phone', 'email', 'sex', 'sex_id',
        'importance_id', 'importance', 'discount',
        'first_visit_date', 'last_visit_date',
        'sold_amount', 'visit_count', 'avg_sum',  // Ключевые поля для ИВК!
        'balance', 'spent', 'paid',                // Финансовые данные
        'birth_date', 'comment', 'categories'
      ],
      ...(params?.fullname && { fullname: params.fullname }),
      ...(params?.phone && { phone: params.phone }),
    };

    const response = await this.request<YclientsClient[]>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data || [];
  }

  /**
   * Получить информацию о клиенте
   */
  async getClient(clientId: number): Promise<YclientsClient | null> {
    const endpoint = `/company/${this.companyId}/clients/${clientId}`;
    const response = await this.request<YclientsClient>(endpoint);
    return response.data || null;
  }

  /**
   * Получить записи (appointments)
   */
  async getRecords(params?: {
    start_date?: string;
    end_date?: string;
    staff_id?: number;
    client_id?: number;
    page?: number;
    count?: number;
  }): Promise<YclientsRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.staff_id) searchParams.set('staff_id', String(params.staff_id));
    if (params?.client_id) searchParams.set('client_id', String(params.client_id));
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.count) searchParams.set('count', String(params.count));

    const query = searchParams.toString();
    const endpoint = `/records/${this.companyId}${query ? `?${query}` : ''}`;

    const response = await this.request<YclientsRecord[]>(endpoint);
    return response.data || [];
  }

  /**
   * Получить список сотрудников
   */
  async getStaff(): Promise<YclientsStaff[]> {
    const endpoint = `/company/${this.companyId}/staff`;
    const response = await this.request<YclientsStaff[]>(endpoint);
    return response.data || [];
  }

  /**
   * Получить список услуг
   */
  async getServices(): Promise<YclientsService[]> {
    const endpoint = `/company/${this.companyId}/services`;
    const response = await this.request<YclientsService[]>(endpoint);
    return response.data || [];
  }

  /**
   * Проверить подключение к API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getStaff();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получить количество клиентов
   */
  async getClientsCount(): Promise<number> {
    const clients = await this.getClients({ count: 1 });
    // YClients возвращает meta.total_count, но нужно проверить
    return clients.length;
  }
}

// Singleton instance
export const yclientsApi = new YclientsAPI();

// Export class for testing
export { YclientsAPI };
