import { tripApi } from "@/api/tripApi";
import type { TripData, TripFilters } from "@/api/tripApi";

export const tripService = {
  getAll: async (params?: TripFilters) => {
    return await tripApi.getAll(params);
  },
  getById: async (id: string): Promise<TripData> => {
    return tripApi.getById(id);
  },
  create: async (payload: Partial<TripData>): Promise<TripData> => {
    return tripApi.create(payload);
  },
  update: async (id: string, payload: Partial<TripData>): Promise<TripData> => {
    return tripApi.update(id, payload);
  },
  updateStatus: async (id: string, status: string): Promise<TripData> => {
    return tripApi.updateStatus(id, status);
  },
  delete: async (id: string): Promise<void> => {
    return tripApi.delete(id);
  },
};
