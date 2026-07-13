import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface ConfigData {
  _id: string;
  baseCurrency: string;
  timezone: string;
  platformCommissionPercentage: number;
  driverCommissionPercentage: number;
  taxPercentage: number;
  maintenanceMode: boolean;
  featureFlags: { enableBooking: boolean; enablePayments: boolean; enableTicketing: boolean };
  pricingRules: { defaultBaseFareMultiplier: number; vipMultiplier: number };
}

export const configApi = {
  get: async (): Promise<ConfigData> => {
    const { data } = await apiClient.get<ApiResponse<ConfigData>>("/config");
    return data.data;
  },
  update: async (payload: Partial<ConfigData>): Promise<ConfigData> => {
    const { data } = await apiClient.patch<ApiResponse<ConfigData>>("/config", payload);
    return data.data;
  },
  reset: async (): Promise<ConfigData> => {
    const { data } = await apiClient.post<ApiResponse<ConfigData>>("/config/reset");
    return data.data;
  },
};
