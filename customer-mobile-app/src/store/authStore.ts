import { create } from 'zustand';
import { User } from '../data/types';
import apiClient from '../services/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initializeFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('auth_token');
      delete apiClient.defaults.headers.common['Authorization'];
    }
    set({ token });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  initializeFromStorage: () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, isLoading: true });
    } else {
      set({ isLoading: false });
    }
  },
}));
