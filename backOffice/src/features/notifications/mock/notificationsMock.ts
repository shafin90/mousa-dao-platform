import type { NotificationData } from "@/api/notificationApi";
export const mockNotifications: NotificationData[] = [
  { _id: "N001", userId: "", type: "booking", message: "Booking B005 confirmed for New York to Boston.", key: "bookingConfirmed", isRead: false, createdAt: "2023-11-10T09:00:00Z" },
  { _id: "N002", userId: "", type: "system", message: "Bus B-402 reported AC failure.", key: "maintenanceRequired", isRead: false, createdAt: "2023-11-10T10:15:00Z" },
  { _id: "N003", userId: "", type: "payment", message: "Stripe payment failed for Customer John.", key: "paymentFailed", isRead: true, createdAt: "2023-11-09T14:20:00Z" },
  { _id: "N004", userId: "", type: "system", message: "Scheduled maintenance at 2 AM EST.", key: "systemUpdate", isRead: true, createdAt: "2023-11-08T08:00:00Z" },
];
