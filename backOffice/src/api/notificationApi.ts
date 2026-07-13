import apiClient from "./apiClient";
import { extractList } from "./extractList";
import type { ApiResponse } from "@/shared/types";

export interface NotificationData {
  _id: string;
  userId: string;
  type: string;
  message: string;
  key?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getMy: async (): Promise<NotificationData[]> => {
    const { data } = await apiClient.get<ApiResponse<NotificationData[]>>("/notifications/my");
    return data.data;
  },
  getAll: async (params?: { page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ data: unknown; pagination?: { total?: number } }>("/notifications", { params });
    const { items, total } = extractList<NotificationData>(data, "notifications");
    return { notifications: items, total };
  },
  markAsRead: async (id: string): Promise<NotificationData> => {
    const { data } = await apiClient.patch<ApiResponse<NotificationData>>(`/notifications/${id}/read`);
    return data.data;
  },
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch("/notifications/read-all");
  },
};
