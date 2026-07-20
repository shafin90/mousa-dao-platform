import { tripApi } from "@/api/tripApi";
import type { TripData, TripInput, TripFilters } from "@/api/tripApi";

export const tripService = {
  getAll: async (params?: TripFilters) => {
    return await tripApi.getAll(params);
  },
  getById: async (id: string): Promise<TripData> => {
    return tripApi.getById(id);
  },
  create: async (payload: TripInput): Promise<TripData> => {
    return tripApi.create(payload);
  },
  update: async (id: string, payload: Partial<TripInput>): Promise<TripData> => {
    return tripApi.update(id, payload);
  },
  updateStatus: async (id: string, status: string): Promise<TripData> => {
    return tripApi.updateStatus(id, status);
  },
  delete: async (id: string): Promise<void> => {
    return tripApi.delete(id);
  },
};
