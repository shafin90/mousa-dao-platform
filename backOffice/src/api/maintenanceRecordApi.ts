import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface MaintenanceRecord {
  _id: string;
  busId?: { _id: string; busNumber?: string; name?: string; plateNumber?: string } | string | null;
  facilityId?: { _id: string; name: string; address?: string; phone?: string } | string | null;
  date: string;
  type: string;
  description: string;
  cost: number;
  performedBy?: string;
  odometer?: number;
  nextServiceDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceRecordParams {
  busId?: string;
  facilityId?: string;
  type?: string;
}

export interface MaintenancePayload {
  busId: string;
  facilityId?: string | null;
  date: string;
  type: string;
  description: string;
  cost?: number;
  performedBy?: string;
  odometer?: number;
  nextServiceDate?: string | null;
}

export const maintenanceRecordApi = {
  getAll: async (params?: MaintenanceRecordParams): Promise<MaintenanceRecord[]> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceRecord[]>>("/maintenance-records", { params });
    return data.data;
  },
  getById: async (id: string): Promise<MaintenanceRecord> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceRecord>>(`/maintenance-records/${id}`);
    return data.data;
  },
  create: async (payload: MaintenancePayload): Promise<MaintenanceRecord> => {
    const { data } = await apiClient.post<ApiResponse<MaintenanceRecord>>("/maintenance-records", payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<MaintenancePayload>): Promise<MaintenanceRecord> => {
    const { data } = await apiClient.patch<ApiResponse<MaintenanceRecord>>(`/maintenance-records/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance-records/${id}`);
  },
};
