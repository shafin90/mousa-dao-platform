import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";
import type { RouteStop } from "./routeApi";

export interface TripData {
  _id: string;
  routeId: { _id: string; fromStation: { _id: string; name: string }; toStation: { _id: string; name: string }; baseFare: number; distanceKm: number; estimatedTimeMinutes: number; stops?: RouteStop[] };
  busId: { _id: string; busNumber: string; name: string; capacity: number; type: string };
  departureTime: string;
  arrivalTime: string;
  date: string;
  price: number;
  seatsTotal: number;
  seatsBooked: number;
  status: "scheduled" | "active" | "completed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

export interface TripFilters {
  routeId?: string;
  busId?: string;
  date?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  fromStation?: string;
  toStation?: string;
}

export const tripApi = {
  getAll: async (params?: TripFilters) => {
    const { data } = await apiClient.get<ApiResponse<TripData[]>>("/trips", { params });
    return data.data;
  },
  getById: async (id: string): Promise<TripData> => {
    const { data } = await apiClient.get<ApiResponse<TripData>>(`/trips/${id}`);
    return data.data;
  },
  create: async (payload: Partial<TripData>): Promise<TripData> => {
    const { data } = await apiClient.post<ApiResponse<TripData>>("/trips", payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<TripData>): Promise<TripData> => {
    const { data } = await apiClient.patch<ApiResponse<TripData>>(`/trips/${id}`, payload);
    return data.data;
  },
  updateStatus: async (id: string, status: string): Promise<TripData> => {
    const { data } = await apiClient.patch<ApiResponse<TripData>>(`/trips/${id}/status`, { status });
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/trips/${id}`);
  },
};
