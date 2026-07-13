import { busApi } from "@/api/busApi";
import type { BusData } from "@/api/busApi";

export const fleetService = {
  getAll: async (params?: { status?: string; type?: string; page?: number; limit?: number }) => {
    const result = await busApi.getAll(params);
    return result;
  },
  create: async (payload: Partial<BusData>): Promise<BusData> => {
    return busApi.create(payload);
  },
  update: async (id: string, payload: Partial<BusData>): Promise<BusData> => {
    return busApi.update(id, payload);
  },
  updateStatus: async (id: string, status: string): Promise<BusData> => {
    return busApi.updateStatus(id, status);
  },
  assignDriver: async (id: string, driverId: string): Promise<BusData> => {
    return busApi.assignDriver(id, driverId);
  },
  delete: async (id: string): Promise<void> => {
    return busApi.delete(id);
  },
};
