import { routeApi } from "@/api/routeApi";
import type { RouteData } from "@/api/routeApi";

export const routeService = {
  getAll: async (): Promise<RouteData[]> => {
    return await routeApi.getAll();
  },
  getById: async (id: string): Promise<RouteData> => {
    return await routeApi.getById(id);
  },
  create: async (payload: Partial<RouteData>): Promise<RouteData> => {
    return routeApi.create(payload);
  },
  update: async (id: string, payload: Partial<RouteData>): Promise<RouteData> => {
    return routeApi.update(id, payload);
  },
  delete: async (id: string): Promise<void> => {
    return routeApi.delete(id);
  },
};
