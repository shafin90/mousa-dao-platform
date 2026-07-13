import { paymentApi, refundRequestApi } from "@/api/paymentApi";
import type { PaymentData, RefundRequestData } from "@/api/paymentApi";

export const paymentService = {
  getPayments: async (params?: { page?: number; limit?: number; status?: string }) => {
    return await paymentApi.getAll(params);
  },
  getPaymentById: async (id: string): Promise<PaymentData> => {
    return await paymentApi.getById(id);
  },
  getRefunds: async (params?: { page?: number; limit?: number }) => {
    return await refundRequestApi.getAll(params);
  },
  approveRefund: async (id: string, adminNote?: string): Promise<RefundRequestData> => {
    return await refundRequestApi.approve(id, adminNote);
  },
  rejectRefund: async (id: string, adminNote?: string): Promise<RefundRequestData> => {
    return await refundRequestApi.reject(id, adminNote);
  },
};
