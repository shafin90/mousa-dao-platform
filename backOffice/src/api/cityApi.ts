import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface CityData {
  _id: string;
  name: string;
  country: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CityFilters {
  country?: string;
  search?: string;
}

export const cityApi = {
  getAll: async (params?: CityFilters): Promise<CityData[]> => {
    const { data } = await apiClient.get<ApiResponse<CityData[]>>("/cities", { params });
    return data.data;
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
};
