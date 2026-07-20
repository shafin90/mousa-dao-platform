import { routeApi } from "@/api/routeApi";
import type { RouteData, RouteInput } from "@/api/routeApi";

export const routeService = {
  getAll: async (): Promise<RouteData[]> => {
    return await routeApi.getAll();
  },
  getById: async (id: string): Promise<RouteData> => {
    return await routeApi.getById(id);
  },
  create: async (payload: RouteInput): Promise<RouteData> => {
    return routeApi.create(payload as any);
  },
  update: async (id: string, payload: Partial<RouteInput>): Promise<RouteData> => {
    return routeApi.update(id, payload as any);
  },
  delete: async (id: string): Promise<void> => {
    return routeApi.delete(id);
  },
};
