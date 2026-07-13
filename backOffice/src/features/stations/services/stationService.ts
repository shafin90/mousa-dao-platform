import { stationApi } from "@/api/stationApi";
import type { StationData } from "@/api/stationApi";

export const stationService = {
  getAll: async (): Promise<StationData[]> => {
    return await stationApi.getAll();
  },
  create: async (payload: Partial<StationData>): Promise<StationData> => {
    return stationApi.create(payload);
  },
  update: async (id: string, payload: Partial<StationData>): Promise<StationData> => {
    return stationApi.update(id, payload);
  },
  delete: async (id: string): Promise<void> => {
    return stationApi.delete(id);
  },
};
