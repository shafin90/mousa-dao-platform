import { analyticsApi } from "@/api/analyticsApi";
import type { AnalyticsData } from "@/api/analyticsApi";

export const analyticsService = {
  getAll: async (): Promise<AnalyticsData> => {
    const [stats, revenue, bookingAnalytics, tripOccupancy, userRoles, bookingTrends, monthlyRevenue, routePerformance, busUtilization, cancellationStats, peakTimes, customerMetrics, paymentAnalytics] = await Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getRevenue(),
      analyticsApi.getBookingAnalytics(),
      analyticsApi.getTripAnalytics(),
      analyticsApi.getUserAnalytics(),
      analyticsApi.getBookingTrends(),
      analyticsApi.getMonthlyRevenue(),
      analyticsApi.getRoutePerformance(),
      analyticsApi.getBusUtilization(),
      analyticsApi.getCancellationStats(),
      analyticsApi.getPeakTimes(),
      analyticsApi.getCustomerMetrics(),
      analyticsApi.getPaymentAnalytics(),
    ]);

    return {
      stats,
      revenue,
      bookingAnalytics,
      tripOccupancy,
      userRoles,
      bookingTrends,
      monthlyRevenue,
      routePerformance,
      busUtilization,
      cancellationStats,
      peakTimes,
      customerMetrics,
      paymentAnalytics,
    };
  },
};
