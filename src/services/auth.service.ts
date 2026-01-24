import { api } from '@/lib/api';
import type { AuthResponse, LoginCredentials, AdminAuth } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
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
      throw new Error(error.detail || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    api.setToken(data.access_token);
    return data;
  },

  async logout(): Promise<void> {
    api.setToken(null);
  },

  async getCurrentUser(): Promise<AdminAuth> {
    return api.get<AdminAuth>('/v1/auth/me');
  },

  isAuthenticated(): boolean {
    return !!api.getToken();
  },
};
