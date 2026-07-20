import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface StationData {
  _id: string;
  name: string;
  cityId?: { _id: string; name: string; country?: string } | null;
  address?: string;
  address1?: string;
  address2?: string;
  phone1?: string;
  phone2?: string;
  email1?: string;
  email2?: string;
  isActive?: boolean;
  location: { lat: number; lng: number };
  manager1?: string | { _id: string; profile: { firstName: string; lastName: string } };
  manager2?: string | { _id: string; profile: { firstName: string; lastName: string } };
  createdBy?: string | { _id: string; profile: { firstName: string; lastName: string } };
  createdAt?: string;
  updatedAt?: string;
}

export interface DistanceData {
  distanceKm: number;
  estimatedTimeMinutes: number;
}

export const stationApi = {
  getAll: async (): Promise<StationData[]> => {
    const { data } = await apiClient.get<ApiResponse<StationData[]>>("/stations");
    return data.data;
  },

  getById: async (id: string): Promise<StationData> => {
    const { data } = await apiClient.get<ApiResponse<StationData>>(`/stations/${id}`);
    return data.data;
  },

  create: async (payload: Partial<StationData>): Promise<StationData> => {
    const { data } = await apiClient.post<ApiResponse<StationData>>("/stations", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<StationData>): Promise<StationData> => {
    const { data } = await apiClient.patch<ApiResponse<StationData>>(`/stations/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/stations/${id}`);
  },

  getDistance: async (from: string, to: string): Promise<DistanceData> => {
    const { data } = await apiClient.get<ApiResponse<DistanceData>>("/stations/distance", { params: { from, to } });
    return data.data;
  },
};
