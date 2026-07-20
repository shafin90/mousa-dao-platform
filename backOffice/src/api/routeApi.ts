import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export type StopStatus = "confirmed" | "pending" | "cancelled";

/** A populated city reference as returned inside a route stop. */
export interface StopCity {
  _id: string;
  name: string;
}

export interface StopStation {
  _id: string;
  name: string;
}

export interface RouteStop {
  _id?: string;
  cityId: StopCity | string;
  stationId?: StopStation | string;
  name?: string;
  status?: StopStatus;
}

/** Shape sent to the API when persisting stops (city id only). */
export interface RouteStopInput {
  cityId: string;
  stationId?: string;
  name?: string;
  status?: StopStatus;
}

export interface RouteData {
  _id: string;
  fromCity: string | { _id: string; name: string };
  toCity: string | { _id: string; name: string };
  fromStations?: Array<string | { _id: string; name: string }>;
  toStations?: Array<string | { _id: string; name: string }>;
  distanceKm: number;
  estimatedTimeMinutes?: number;
  baseRate?: number;
  isActive?: boolean;
  stops?: RouteStop[];
  createdBy?: string | { _id: string; profile: { firstName: string; lastName: string } };
  createdAt: string;
  updatedAt?: string;
}

/** Normalizes stops to the id-only input shape the API expects. */
export const normalizeStops = (stops?: RouteStop[]): RouteStopInput[] =>
  (stops || []).map((s) => ({
    cityId: typeof s.cityId === "object" ? s.cityId._id : s.cityId,
    stationId: s.stationId ? (typeof s.stationId === "object" ? s.stationId._id : s.stationId) : undefined,
    name: s.name || "",
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
