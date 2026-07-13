import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface MaintenanceRecord {
  _id: string;
  busId?: { _id: string; busNumber?: string; name?: string } | string | null;
  facilityId?: { _id: string; name: string } | string | null;
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

export const maintenanceRecordApi = {
  getAll: async (params?: MaintenanceRecordParams): Promise<MaintenanceRecord[]> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceRecord[]>>("/maintenance-records", { params });
    return data.data;
  },
};
