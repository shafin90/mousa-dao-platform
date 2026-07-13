import apiClient from './client';
import { User } from '../../data/types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data.data;
  },
  register: async (payload: { name: string; email: string; phone: string; password: string }): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data;
  },
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  },
};
