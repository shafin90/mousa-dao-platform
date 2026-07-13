import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export type ScheduleStatus = "upcoming" | "due" | "overdue" | "completed";
export type ScheduleIntervalType = "km" | "months";
export type ScheduleType = "routine" | "repair" | "inspection" | "other";

export interface MaintenanceScheduleData {
  _id: string;
  busId?: { _id: string; busNumber?: string; name?: string; odometer?: number } | string | null;
  title?: string;
  maintenanceType: ScheduleType;
  intervalType: ScheduleIntervalType;
  intervalValue: number;
  lastServiceOdometer?: number;
  lastServiceDate?: string;
  isActive?: boolean;
  notes?: string;
  // Derived (computed server-side, not stored)
  status: ScheduleStatus;
  nextDue?: number | string | null;
  nextDueOdometer?: number;
  remainingKm?: number;
  nextDueDate?: string;
  daysRemaining?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceSchedulePayload {
  busId?: string;
  title?: string;
  maintenanceType?: ScheduleType;
  intervalType?: ScheduleIntervalType;
  intervalValue?: number;
  lastServiceOdometer?: number;
  lastServiceDate?: string | null;
  isActive?: boolean;
  notes?: string;
}

export const maintenanceScheduleApi = {
  getAll: async (params?: { busId?: string }): Promise<MaintenanceScheduleData[]> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceScheduleData[]>>("/maintenance-schedules", { params });
    return data.data;
  },
  getById: async (id: string): Promise<MaintenanceScheduleData> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceScheduleData>>(`/maintenance-schedules/${id}`);
    return data.data;
  },
  create: async (payload: MaintenanceSchedulePayload): Promise<MaintenanceScheduleData> => {
    const { data } = await apiClient.post<ApiResponse<MaintenanceScheduleData>>("/maintenance-schedules", payload);
    return data.data;
  },
  update: async (id: string, payload: MaintenanceSchedulePayload): Promise<MaintenanceScheduleData> => {
    const { data } = await apiClient.patch<ApiResponse<MaintenanceScheduleData>>(`/maintenance-schedules/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance-schedules/${id}`);
  },
};
