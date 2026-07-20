import apiClient from './client';
import { Notification } from '../types';

export const getMyNotifications = async () => {
  const res = await apiClient.get('/notifications/my');
  return res.data.data as Notification[];
};

export const markAsRead = async (id: string) => {
  const res = await apiClient.patch(`/notifications/${id}/read`);
  return res.data.data;
};

export const markAllAsRead = async () => {
  const res = await apiClient.patch('/notifications/read-all');
  return res.data.data;
};
