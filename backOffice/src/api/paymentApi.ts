import apiClient from "./apiClient";
import { extractList } from "./extractList";
import type { ApiResponse } from "@/shared/types";

export interface PaymentData {
  _id: string;
  bookingId: { _id: string; bookingCode: string };
  userId: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  method: string;
  transactionId?: string;
  tx_ref: string;
  paymentLink?: string;
  status: string;
  amount?: number;
  createdAt: string;
}

export interface RefundRequestData {
  _id: string;
  requestId: string;
  bookingId: { _id: string; bookingCode: string };
  userId: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  amount: number;
  reason: string;
  status: string;
  reviewedBy?: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
}

export const paymentApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await apiClient.get<{ data: unknown; pagination?: { total?: number } }>("/payments", { params });
    const { items, total } = extractList<PaymentData>(data, "payments");
    return { payments: items, total };
  },
  getById: async (id: string): Promise<PaymentData> => {
    const { data } = await apiClient.get<ApiResponse<PaymentData>>(`/payments/${id}`);
    return data.data;
  },
  initiate: async (payload: { bookingId: string; method: string }) => {
    const { data } = await apiClient.post<ApiResponse<{ tx_ref: string; eventId: string }>>("/payments/initiate", payload);
    return data.data;
  },
};

export const refundRequestApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await apiClient.get<{ data: unknown; pagination?: { total?: number } }>("/refund-requests", { params });
    const { items, total } = extractList<RefundRequestData>(data, "refunds");
    return { refunds: items, total };
  },
  approve: async (id: string, adminNote?: string) => {
    const { data } = await apiClient.patch<ApiResponse<RefundRequestData>>(`/refund-requests/${id}/approve`, { adminNote });
    return data.data;
  },
  reject: async (id: string, adminNote?: string) => {
    const { data } = await apiClient.patch<ApiResponse<RefundRequestData>>(`/refund-requests/${id}/reject`, { adminNote });
    return data.data;
  },
};
