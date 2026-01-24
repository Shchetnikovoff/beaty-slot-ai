import { api } from '@/lib/api';
import type { AuthResponse, LoginCredentials, AdminAuth } from '@/types';

// Демо-пользователи для тестирования
const DEMO_USERS: Record<string, { password: string; user: AdminAuth }> = {
  admin: {
    password: 'admin123',
    user: {
      id: 'demo-admin-1',
      username: 'admin',
      email: 'admin@beautyslot.ru',
      role: 'admin',
      salon_id: 'salon-1',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
  superadmin: {
    password: 'super123',
    user: {
      id: 'demo-superadmin-1',
      username: 'superadmin',
      email: 'superadmin@beautyslot.ru',
      role: 'superadmin',
      salon_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
};

// Хранение текущего демо-пользователя
let currentDemoUser: AdminAuth | null = null;

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Проверка демо-пользователей
    const demoUser = DEMO_USERS[credentials.username];
    if (demoUser && demoUser.password === credentials.password) {
      const demoToken = `demo-token-${Date.now()}`;
      api.setToken(demoToken);
      currentDemoUser = demoUser.user;
      return {
        access_token: demoToken,
        token_type: 'bearer',
      };
    }

    // Попытка авторизации через реальный API
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Неверный логин или пароль');
      }

      const data: AuthResponse = await response.json();
      api.setToken(data.access_token);
      currentDemoUser = null;
      return data;
    } catch (error) {
      // Если API недоступен и это не демо-пользователь
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Сервер недоступен. Используйте демо-аккаунт: admin / admin123');
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    api.setToken(null);
    currentDemoUser = null;
  },

  async getCurrentUser(): Promise<AdminAuth> {
    // Если это демо-пользователь
    if (currentDemoUser) {
      return currentDemoUser;
    }

    // Получение данных с реального API
    return api.get<AdminAuth>('/v1/auth/me');
  },

  isAuthenticated(): boolean {
    return !!api.getToken();
  },
};
