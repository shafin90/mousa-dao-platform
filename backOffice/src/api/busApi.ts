import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface BusData {
  _id: string;
  busNumber: string;
  name: string;
  capacity: number;
  type: string;
  assignedDriver?: { _id: string; profile: { firstName: string; lastName: string; phone?: string }; email: string };
  status: string;
  features: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;

  // Managers
  busManager?: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  maintenanceManager?: { _id: string; profile: { firstName: string; lastName: string }; email: string };

  // Vehicle identity
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  plateNumber?: string;
  vin?: string;
  fuelType?: string;
  odometer?: number;

  // Registration
  registrationNumber?: string;

  // Compliance & documents
  registrationExpiry?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceIssueDate?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  lastInspectionDate?: string;

  // Service
  firstServiceDate?: string;
  matriculationDate?: string;

  // Purchase & acquisition
  purchaseDate?: string;
  purchaseCost?: number;
  homeDepot?: string;

  // Media
  photos?: string[];
}

export interface MaintenanceLog {
  _id: string;
  busId: string;
  date: string;
  type: "routine" | "repair" | "inspection" | "other";
  description: string;
  cost: number;
  odometer?: number;
  performedBy?: string;
  nextServiceDate?: string;
  createdAt: string;
}

export interface MaintenancePayload {
  date: string;
  type?: string;
  description: string;
  cost?: number;
  odometer?: number;
  performedBy?: string;
  nextServiceDate?: string;
}

export const busApi = {
  getAll: async (params?: { status?: string; type?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ data: unknown; pagination?: { total?: number } }>("/buses", { params });
    const payload = data.data;
    // Backend may return either a paginated array ({ data: [...], pagination })
    // or an object ({ buses, total }). Normalize both shapes.
    if (Array.isArray(payload)) {
      return { buses: payload as BusData[], total: data.pagination?.total ?? payload.length };
    }
    const obj = (payload || {}) as { buses?: BusData[]; total?: number };
    return { buses: obj.buses ?? [], total: obj.total ?? 0 };
  },
  getById: async (id: string): Promise<BusData> => {
    const { data } = await apiClient.get<ApiResponse<BusData>>(`/buses/${id}`);
    return data.data;
  },
  create: async (payload: Partial<BusData>): Promise<BusData> => {
    const { data } = await apiClient.post<ApiResponse<BusData>>("/buses", payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<BusData>): Promise<BusData> => {
    const { data } = await apiClient.patch<ApiResponse<BusData>>(`/buses/${id}`, payload);
    return data.data;
  },
  updateStatus: async (id: string, status: string): Promise<BusData> => {
    const { data } = await apiClient.patch<ApiResponse<BusData>>(`/buses/${id}/status`, { status });
    return data.data;
  },
  assignDriver: async (id: string, driverId: string): Promise<BusData> => {
    const { data } = await apiClient.patch<ApiResponse<BusData>>(`/buses/${id}/assign-driver`, { driverId });
    return data.data;
  },
  getMaintenance: async (id: string): Promise<MaintenanceLog[]> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceLog[]>>(`/buses/${id}/maintenance`);
    return data.data;
  },
  addMaintenanceLog: async (id: string, payload: MaintenancePayload): Promise<MaintenanceLog> => {
    const { data } = await apiClient.post<ApiResponse<MaintenanceLog>>(`/buses/${id}/maintenance`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/buses/${id}`);
  },
};
