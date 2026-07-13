import { notificationApi } from "@/api/notificationApi";
import type { NotificationData } from "@/api/notificationApi";

export const notificationService = {
  getMy: async (): Promise<NotificationData[]> => {
    return await notificationApi.getMy();
  },
  markAsRead: async (id: string): Promise<NotificationData> => {
    return notificationApi.markAsRead(id);
  },
  markAllAsRead: async (): Promise<void> => {
    await notificationApi.markAllAsRead();
  },
};
