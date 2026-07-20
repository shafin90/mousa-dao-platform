import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { firebaseAuth, getMe } from '../api/auth';
import { User } from '../types';
import { router } from 'expo-router';
import { signOutFirebase } from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const savedToken = await storage.getToken();
      const savedUser = await storage.getUser();
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(
    async (idToken: string, phone: string, name?: string) => {
      const result = await firebaseAuth(idToken, phone, name);
      await storage.setToken(result.token);
      await storage.setUser(result.user);
      setToken(result.token);
      setUser(result.user);
      return result;
    },
    []
  );

  const logout = useCallback(async () => {
    await storage.clearAll();
    await signOutFirebase();
    setToken(null);
    setUser(null);
    router.replace('/(auth)');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await getMe();
      await storage.setUser(updatedUser);
      setUser(updatedUser);
    } catch {
    }
  }, []);

  return { user, token, loading, login, logout, refreshUser, isAuthenticated: !!token };
}
