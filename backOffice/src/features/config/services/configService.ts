import { configApi } from "@/api/configApi";
import type { ConfigData } from "@/api/configApi";

export const configService = {
  get: async (): Promise<ConfigData> => {
    return await configApi.get();
  },
  update: async (payload: Partial<ConfigData>): Promise<ConfigData> => {
    return await configApi.update(payload);
  },
  reset: async (): Promise<ConfigData> => {
    return await configApi.reset();
  },
};
