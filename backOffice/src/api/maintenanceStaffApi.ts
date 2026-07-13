import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface MaintenanceStaffData {
  _id: string;
  name: string;
  phone?: string;
  role?: string;
  facilityId?: { _id: string; name: string } | string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const maintenanceStaffApi = {
  getAll: async (): Promise<MaintenanceStaffData[]> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceStaffData[]>>("/maintenance-staff");
    return data.data;
  },
  getById: async (id: string): Promise<MaintenanceStaffData> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceStaffData>>(`/maintenance-staff/${id}`);
    return data.data;
  },
  create: async (payload: Partial<MaintenanceStaffData>): Promise<MaintenanceStaffData> => {
    const { data } = await apiClient.post<ApiResponse<MaintenanceStaffData>>("/maintenance-staff", payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<MaintenanceStaffData>): Promise<MaintenanceStaffData> => {
    const { data } = await apiClient.patch<ApiResponse<MaintenanceStaffData>>(`/maintenance-staff/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance-staff/${id}`);
  },
};
