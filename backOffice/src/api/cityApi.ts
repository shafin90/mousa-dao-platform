import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface CityData {
  _id: string;
  name: string;
  country: string;
  location?: { lat: number; lng: number };
  address1?: string;
  address2?: string;
  phone1?: string;
  phone2?: string;
  email1?: string;
  email2?: string;
  manager1?: string | { _id: string; profile: { firstName: string; lastName: string } };
  manager2?: string | { _id: string; profile: { firstName: string; lastName: string } };
  isActive?: boolean;
  createdBy?: string | { _id: string; profile: { firstName: string; lastName: string } };
  createdAt?: string;
  updatedAt?: string;
}

export interface CityFilters {
  country?: string;
  search?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const cityApi = {
  getAll: async (params?: CityFilters): Promise<{ data: CityData[]; pagination: PaginationInfo }> => {
    const { data } = await apiClient.get<ApiResponse<CityData[]> & { pagination?: PaginationInfo }>("/cities", { params });
    return { data: data.data, pagination: data.pagination || { total: data.data.length, page: 1, limit: data.data.length, pages: 1 } };
  },
  getById: async (id: string): Promise<CityData> => {
    const { data } = await apiClient.get<ApiResponse<CityData>>(`/cities/${id}`);
    return data.data;
  },
  create: async (payload: Partial<CityData>): Promise<CityData> => {
    const { data } = await apiClient.post<ApiResponse<CityData>>("/cities", payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<CityData>): Promise<CityData> => {
    const { data } = await apiClient.patch<ApiResponse<CityData>>(`/cities/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cities/${id}`);
  },

  getDistance: async (from: string, to: string): Promise<{ distanceKm: number; estimatedTimeMinutes: number }> => {
    const { data } = await apiClient.get<ApiResponse<{ distanceKm: number; estimatedTimeMinutes: number }>>("/cities/distance", { params: { from, to } });
    return data.data;
  },
  geocode: async (id: string): Promise<CityData> => {
    const { data } = await apiClient.post<ApiResponse<CityData>>(`/cities/${id}/geocode`);
    return data.data;
  },
};
