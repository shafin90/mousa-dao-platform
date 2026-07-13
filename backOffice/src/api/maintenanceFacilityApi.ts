import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface MaintenanceFacilityData {
  _id: string;
  name: string;
  cityId?: { _id: string; name: string } | string | null;
  address?: string;
  phone?: string;
  manager?: string;
  capacity?: number;
  services?: string[];
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacilityMaintenanceRecord {
  _id: string;
  busId?: { _id: string; busNumber?: string; name?: string } | string | null;
  date: string;
  type: string;
  description: string;
  cost: number;
  performedBy?: string;
  createdAt?: string;
}

export const maintenanceFacilityApi = {
  getAll: async (): Promise<MaintenanceFacilityData[]> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceFacilityData[]>>("/maintenance-facilities");
    return data.data;
  },
  getById: async (id: string): Promise<MaintenanceFacilityData> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceFacilityData>>(`/maintenance-facilities/${id}`);
    return data.data;
  },
  create: async (payload: Partial<MaintenanceFacilityData>): Promise<MaintenanceFacilityData> => {
    const { data } = await apiClient.post<ApiResponse<MaintenanceFacilityData>>("/maintenance-facilities", payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<MaintenanceFacilityData>): Promise<MaintenanceFacilityData> => {
    const { data } = await apiClient.patch<ApiResponse<MaintenanceFacilityData>>(`/maintenance-facilities/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance-facilities/${id}`);
  },
  getMaintenance: async (id: string): Promise<FacilityMaintenanceRecord[]> => {
    const { data } = await apiClient.get<ApiResponse<FacilityMaintenanceRecord[]>>(`/maintenance-facilities/${id}/maintenance`);
    return data.data;
  },
};
