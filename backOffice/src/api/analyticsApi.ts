import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

export interface DashboardData {
  totalRevenue: number;
  totalBookings: number;
  totalTrips: number;
  totalUsers: number;
  activeBuses: number;
  occupancyRate: number;
}

export interface DailyRevenue {
  _id: string;
  dailyRevenue: number;
}

export interface RevenueByMethod {
  _id: string;
  total: number;
  count: number;
}

export interface RevenueData {
  dailyRevenue: DailyRevenue[];
  revenueByMethod: RevenueByMethod[];
  totalRevenue: number;
}

export interface BookingsByStatus {
  [status: string]: number;
}

export interface TopRoute {
  _id: string;
  count: number;
  route: Array<{ _id: string; fromStation: string; toStation: string }>;
}

export interface BookingAnalytics {
  bookingsByStatus: BookingsByStatus;
  topRoutes: TopRoute[];
}

export interface TripOccupancy {
  _id: string;
  occupancyRate: number;
  routeId: string;
}

export interface UserRoleCount {
  _id: string;
  count: number;
}

export interface DashboardChartData {
  dailyRevenue: DailyRevenue[];
  revenueByMethod: RevenueByMethod[];
  bookingsByStatus: BookingsByStatus;
  topRoutes: TopRoute[];
  tripOccupancy: TripOccupancy[];
  userRoles: UserRoleCount[];
  bookingTrends: BookingTrend[];
}

export interface BookingTrend {
  _id: string;
  count: number;
  revenue: number;
}

export interface MonthlyRevenue {
  _id: string;
  revenue: number;
  transactions: number;
}

export interface RoutePerformance {
  _id: string;
  bookings: number;
  totalRevenue: number;
  fromStationName: string;
  toStationName: string;
}

export interface BusUtilization {
  busNumber: string;
  totalTrips: number;
  avgOccupancy: number;
  totalSeats: number;
  totalBooked: number;
}

export interface CancellationByRoute {
  fromStationName: string;
  toStationName: string;
  total: number;
  cancelled: number;
  rate: number;
}

export interface CancellationStats {
  totalBookings: number;
  cancelledBookings: number;
  cancellationRate: number;
  byRoute: CancellationByRoute[];
}

export interface PeakTime {
  _id: string;
  tripCount: number;
  totalBookings: number;
}

export interface LiveTrip {
  _id: string;
  route: string;
  bus: string;
  departureTime: string;
  date: string;
  seatsTotal: number;
  seatsBooked: number;
  status: string;
  occupancyRate: number;
}

export interface RecentBookingItem {
  _id: string;
  customer: string;
  route: string;
  seats: number;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

export interface PaymentSummaryData {
  successful: number;
  failed: number;
  pending: number;
  total: number;
  successRate: number;
}

export interface AlertItem {
  type: 'warning' | 'error' | 'success';
  key: string;
  message: string;
  count: number;
}

export interface TodayStats {
  todayBookings: number;
  todayRevenue: number;
  activeTrips: number;
  todayPassengers: number;
  pendingPayments: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  repeatCustomers: number;
  customerGrowthRate: number;
}

export interface PaymentMethodItem {
  _id: string;
  count: number;
  total: number;
}

export interface PaymentAnalyticsData {
  paymentMethodDistribution: PaymentMethodItem[];
  statusSummary: Record<string, number>;
  totalPayments: number;
  successRate: number;
}

export interface AnalyticsData {
  stats: DashboardData;
  revenue: RevenueData;
  bookingAnalytics: BookingAnalytics;
  tripOccupancy: TripOccupancy[];
  userRoles: UserRoleCount[];
  bookingTrends: BookingTrend[];
  monthlyRevenue: MonthlyRevenue[];
  routePerformance: RoutePerformance[];
  busUtilization: BusUtilization[];
  cancellationStats: CancellationStats;
  peakTimes: PeakTime[];
  customerMetrics: CustomerMetrics;
  paymentAnalytics: PaymentAnalyticsData;
}

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await apiClient.get<ApiResponse<DashboardData>>("/analytics/dashboard");
    return data.data;
  },

  getRevenue: async (startDate?: string, endDate?: string): Promise<RevenueData> => {
    const { data } = await apiClient.get<ApiResponse<RevenueData>>("/analytics/revenue", { params: { startDate, endDate } });
    return data.data;
  },

  getBookingAnalytics: async (): Promise<BookingAnalytics> => {
    const { data } = await apiClient.get<ApiResponse<BookingAnalytics>>("/analytics/bookings");
    return data.data;
  },

  getTripAnalytics: async (): Promise<TripOccupancy[]> => {
    const { data } = await apiClient.get<ApiResponse<TripOccupancy[]>>("/analytics/trips");
    return data.data;
  },

  getUserAnalytics: async (): Promise<UserRoleCount[]> => {
    const { data } = await apiClient.get<ApiResponse<UserRoleCount[]>>("/analytics/users");
    return data.data;
  },

  getBookingTrends: async (): Promise<BookingTrend[]> => {
    const { data } = await apiClient.get<ApiResponse<BookingTrend[]>>("/analytics/booking-trends");
    return data.data;
  },

  getMonthlyRevenue: async (): Promise<MonthlyRevenue[]> => {
    const { data } = await apiClient.get<ApiResponse<MonthlyRevenue[]>>("/analytics/monthly-revenue");
    return data.data;
  },

  getRoutePerformance: async (): Promise<RoutePerformance[]> => {
    const { data } = await apiClient.get<ApiResponse<RoutePerformance[]>>("/analytics/route-performance");
    return data.data;
  },

  getBusUtilization: async (): Promise<BusUtilization[]> => {
    const { data } = await apiClient.get<ApiResponse<BusUtilization[]>>("/analytics/bus-utilization");
    return data.data;
  },

  getCancellationStats: async (): Promise<CancellationStats> => {
    const { data } = await apiClient.get<ApiResponse<CancellationStats>>("/analytics/cancellation-stats");
    return data.data;
  },

  getPeakTimes: async (): Promise<PeakTime[]> => {
    const { data } = await apiClient.get<ApiResponse<PeakTime[]>>("/analytics/peak-times");
    return data.data;
  },
  getLiveTrips: async (): Promise<LiveTrip[]> => {
    const { data } = await apiClient.get<ApiResponse<LiveTrip[]>>("/analytics/live-trips");
    return data.data;
  },
  getRecentBookings: async (): Promise<RecentBookingItem[]> => {
    const { data } = await apiClient.get<ApiResponse<RecentBookingItem[]>>("/analytics/recent-bookings");
    return data.data;
  },
  getPaymentSummary: async (): Promise<PaymentSummaryData> => {
    const { data } = await apiClient.get<ApiResponse<PaymentSummaryData>>("/analytics/payment-summary");
    return data.data;
  },
  getAlerts: async (): Promise<AlertItem[]> => {
    const { data } = await apiClient.get<ApiResponse<AlertItem[]>>("/analytics/alerts");
    return data.data;
  },
  getTodayStats: async (): Promise<TodayStats> => {
    const { data } = await apiClient.get<ApiResponse<TodayStats>>("/analytics/today-stats");
    return data.data;
  },
  getCustomerMetrics: async (): Promise<CustomerMetrics> => {
    const { data } = await apiClient.get<ApiResponse<CustomerMetrics>>("/analytics/customer-metrics");
    return data.data;
  },
  getPaymentAnalytics: async (): Promise<PaymentAnalyticsData> => {
    const { data } = await apiClient.get<ApiResponse<PaymentAnalyticsData>>("/analytics/payment-analytics");
    return data.data;
  },
};
