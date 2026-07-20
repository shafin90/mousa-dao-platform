import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";
import type { RouteStop } from "./routeApi";

export interface TripData {
  _id: string;
  routeId?: { _id: string; fromCity: { _id: string; name: string }; toCity: { _id: string; name: string }; fromStations?: { _id: string; name: string }[]; toStations?: { _id: string; name: string }[]; distanceKm: number; estimatedTimeMinutes: number; baseRate?: number; stops?: RouteStop[] };
  fromStation?: string | { _id: string; name: string };
  toStation?: string | { _id: string; name: string };
  busId: string | { _id: string; busNumber: string; name: string; capacity: number; type: string };
  departureTime: string;
  arrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  delayMinutes?: number;
  date: string;
  price: number;
  seatsTotal: number;
  seatsBooked: number;
  status: "scheduled" | "active" | "completed" | "cancelled";
  createdBy?: { _id: string; firstName: string; lastName: string; email: string };
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
  deleteAll: async (): Promise<number> => {
    const { data } = await apiClient.delete<ApiResponse<{ deletedCount: number }>>("/trips");
    return data.data.deletedCount;
  },
};
