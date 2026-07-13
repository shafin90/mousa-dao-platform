import { authApi } from './api/authApi';
import { useAuthStore } from '../store/authStore';

export const authService = {
  async login(email: string, password: string) {
    const { user, token } = await authApi.login(email, password);
    useAuthStore.getState().setToken(token);
    useAuthStore.getState().setUser(user);
    return user;
  },

  async register(data: { name: string; email: string; phone: string; password: string }) {
    const { user, token } = await authApi.register(data);
    useAuthStore.getState().setToken(token);
    useAuthStore.getState().setUser(user);
    return user;
  },

  async logout() {
    useAuthStore.getState().logout();
  },
};
