import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export type WorkOrderStatus = "pending" | "in_progress" | "waiting_parts" | "completed" | "cancelled";
export type WorkOrderPriority = "low" | "medium" | "high" | "urgent";
export type WorkOrderType = "routine" | "repair" | "inspection" | "other";

export interface WorkOrderData {
  _id: string;
  workOrderNumber: string;
  busId?: { _id: string; busNumber?: string; name?: string } | string | null;
  maintenanceType: WorkOrderType;
  priority: WorkOrderPriority;
  assignedTechnician?: { _id: string; name: string } | string | null;
  facilityId?: { _id: string; name: string } | string | null;
  description?: string;
  expectedCompletion?: string;
  status: WorkOrderStatus;
  cost?: number;
  odometer?: number;
  completedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkOrderPayload {
  busId?: string;
  maintenanceType?: WorkOrderType;
  priority?: WorkOrderPriority;
  assignedTechnician?: string | null;
  facilityId?: string | null;
  description?: string;
  expectedCompletion?: string | null;
  status?: WorkOrderStatus;
  cost?: number;
  odometer?: number;
  notes?: string;
}

export interface WorkOrderParams {
  status?: string;
  busId?: string;
  priority?: string;
}

export const workOrderApi = {
  getAll: async (params?: WorkOrderParams): Promise<WorkOrderData[]> => {
    const { data } = await apiClient.get<ApiResponse<WorkOrderData[]>>("/work-orders", { params });
    return data.data;
  },
  getById: async (id: string): Promise<WorkOrderData> => {
    const { data } = await apiClient.get<ApiResponse<WorkOrderData>>(`/work-orders/${id}`);
    return data.data;
  },
  create: async (payload: WorkOrderPayload): Promise<WorkOrderData> => {
    const { data } = await apiClient.post<ApiResponse<WorkOrderData>>("/work-orders", payload);
    return data.data;
  },
  update: async (id: string, payload: WorkOrderPayload): Promise<WorkOrderData> => {
    const { data } = await apiClient.patch<ApiResponse<WorkOrderData>>(`/work-orders/${id}`, payload);
    return data.data;
  },
  updateStatus: async (id: string, status: WorkOrderStatus): Promise<WorkOrderData> => {
    const { data } = await apiClient.patch<ApiResponse<WorkOrderData>>(`/work-orders/${id}/status`, { status });
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/work-orders/${id}`);
  },
};
