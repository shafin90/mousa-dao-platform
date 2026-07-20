import apiClient from './client';
import { User } from '../types';

export const firebaseAuth = async (idToken: string, phone: string, name?: string) => {
  const res = await apiClient.post('/auth/firebase', { idToken, phone, name });
  return res.data.data as { user: User; token: string };
};

export const getMe = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data.data as User;
};

export const updateProfile = async (data: Partial<User>) => {
  const res = await apiClient.patch('/users/me', data);
  return res.data.data as User;
};
