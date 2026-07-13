import apiClient from "./apiClient";
import { extractList } from "./extractList";
import type { ApiResponse } from "@/shared/types";

export interface AuditLogData {
  _id: string;
  userId: { _id: string; email: string };
  action: string;
  module: string;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  status: string;
  createdAt: string;
}

export const auditApi = {
  getAll: async (params?: { page?: number; limit?: number; module?: string; action?: string }) => {
    const { data } = await apiClient.get<{ data: unknown; pagination?: { total?: number } }>("/audit", { params });
    const { items, total } = extractList<AuditLogData>(data, "logs");
    return { logs: items, total };
  },
  getById: async (id: string): Promise<AuditLogData> => {
    const { data } = await apiClient.get<ApiResponse<AuditLogData>>(`/audit/${id}`);
    return data.data;
  },
};
