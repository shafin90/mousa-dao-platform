import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { authApi } from '../services/api/authApi';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && !user) {
      authApi.getMe()
        .then(setUser)
        .catch(() => storeLogout())
        .finally(() => setLoading(false));
    } else if (!token) {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    return await authService.login(email, password);
  };

  const register = async (data: { name: string; email: string; phone: string; password: string }) => {
    return await authService.register(data);
  };

  const logout = () => {
    authService.logout();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    displayName: user?.name || user?.email || '',
    userEmail: user?.email || '',
    login,
    register,
    logout,
  };
}
