import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface MaintenanceDashboardData {
  totalBuses: number;
  busesUnderMaintenance: number;
  upcomingMaintenance: number;
  overdueMaintenance: number;
  breakdownToday: number;
  maintenanceCostThisMonth: number;
  vehiclesOutOfService: number;
}

export const maintenanceDashboardApi = {
  getOverview: async (): Promise<MaintenanceDashboardData> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceDashboardData>>("/maintenance-dashboard");
    return data.data;
  },
};
