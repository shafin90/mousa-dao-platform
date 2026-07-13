import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export type StopStatus = "confirmed" | "pending" | "cancelled";

/** A populated city reference as returned inside a route stop. */
export interface StopCity {
  _id: string;
  name: string;
}

export interface RouteStop {
  _id?: string;
  cityId: StopCity | string;
  arrivalTime?: string;
  departureTime?: string;
  status?: StopStatus;
}

/** Shape sent to the API when persisting stops (city id only). */
export interface RouteStopInput {
  cityId: string;
  arrivalTime?: string;
  departureTime?: string;
  status?: StopStatus;
}

export interface RouteData {
  _id: string;
  fromStation: { _id: string; name: string };
  toStation: { _id: string; name: string };
  baseFare: number;
  distanceKm: number;
  estimatedTimeMinutes?: number;
  stops?: RouteStop[];
  createdAt: string;
  updatedAt?: string;
}

/** Normalizes stops (which may contain populated station objects) to the id-only input shape the API expects. */
export const normalizeStops = (stops?: RouteStop[]): RouteStopInput[] =>
  (stops || []).map((s) => ({
    cityId: typeof s.cityId === "object" ? s.cityId._id : s.cityId,
    arrivalTime: s.arrivalTime || "",
    departureTime: s.departureTime || "",
    status: s.status || "confirmed",
  }));

export const routeApi = {
  getAll: async (): Promise<RouteData[]> => {
    const { data } = await apiClient.get<ApiResponse<RouteData[]>>("/routes");
    return data.data;
  },
  getById: async (id: string): Promise<RouteData> => {
    const { data } = await apiClient.get<ApiResponse<RouteData>>(`/routes/${id}`);
    return data.data;
  },
  create: async (payload: Partial<RouteData>): Promise<RouteData> => {
    const { data } = await apiClient.post<ApiResponse<RouteData>>("/routes", payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<RouteData>): Promise<RouteData> => {
    const { data } = await apiClient.patch<ApiResponse<RouteData>>(`/routes/${id}`, payload);
    return data.data;
  },
  updateStops: async (id: string, stops: RouteStopInput[]): Promise<RouteData> => {
    const { data } = await apiClient.patch<ApiResponse<RouteData>>(`/routes/${id}`, { stops });
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/routes/${id}`);
  },
};
