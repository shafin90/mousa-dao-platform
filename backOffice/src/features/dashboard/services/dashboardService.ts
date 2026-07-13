import { analyticsApi } from "@/api/analyticsApi";
import type { DashboardData, DashboardChartData, LiveTrip, RecentBookingItem, PaymentSummaryData, AlertItem, TodayStats } from "@/api/analyticsApi";

export const dashboardService = {
  getStats: async (): Promise<DashboardData> => {
    return analyticsApi.getDashboard();
  },

  getChartData: async (): Promise<DashboardChartData> => {
    const [revenue, bookingAnalytics, tripOccupancy, userRoles, bookingTrends] = await Promise.all([
      analyticsApi.getRevenue(),
      analyticsApi.getBookingAnalytics(),
      analyticsApi.getTripAnalytics(),
      analyticsApi.getUserAnalytics(),
      analyticsApi.getBookingTrends(),
    ]);

    return {
      dailyRevenue: revenue.dailyRevenue,
      revenueByMethod: revenue.revenueByMethod,
      bookingsByStatus: bookingAnalytics.bookingsByStatus,
      topRoutes: bookingAnalytics.topRoutes,
      tripOccupancy,
      userRoles,
      bookingTrends,
    };
  },

  getLiveTrips: async (): Promise<LiveTrip[]> => {
    return analyticsApi.getLiveTrips();
  },

  getRecentBookings: async (): Promise<RecentBookingItem[]> => {
    return analyticsApi.getRecentBookings();
  },

  getPaymentSummary: async (): Promise<PaymentSummaryData> => {
    return analyticsApi.getPaymentSummary();
  },

  getAlerts: async (): Promise<AlertItem[]> => {
    return analyticsApi.getAlerts();
  },

  getTodayStats: async (): Promise<TodayStats> => {
    return analyticsApi.getTodayStats();
  },
};
