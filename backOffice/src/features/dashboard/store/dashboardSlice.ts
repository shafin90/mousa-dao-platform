import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { DashboardData, DashboardChartData, LiveTrip, RecentBookingItem, PaymentSummaryData, AlertItem, TodayStats } from "@/api/analyticsApi";
import { dashboardService } from "../services/dashboardService";

interface DashboardState {
  stats: DashboardData | null;
  charts: DashboardChartData | null;
  liveTrips: LiveTrip[];
  recentBookings: RecentBookingItem[];
  paymentSummary: PaymentSummaryData | null;
  alerts: AlertItem[];
  todayStats: TodayStats | null;
  loading: boolean;
  chartLoading: boolean;
  extendedLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  charts: null,
  liveTrips: [],
  recentBookings: [],
  paymentSummary: null,
  alerts: [],
  todayStats: null,
  loading: false,
  chartLoading: false,
  extendedLoading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async () => {
    return await dashboardService.getStats();
  }
);

export const fetchDashboardCharts = createAsyncThunk(
  "dashboard/fetchCharts",
  async () => {
    return await dashboardService.getChartData();
  }
);

export const fetchExtendedDashboard = createAsyncThunk(
  "dashboard/fetchExtended",
  async () => {
    const [liveTrips, recentBookings, paymentSummary, alerts, todayStats] = await Promise.all([
      dashboardService.getLiveTrips(),
      dashboardService.getRecentBookings(),
      dashboardService.getPaymentSummary(),
      dashboardService.getAlerts(),
      dashboardService.getTodayStats(),
    ]);
    return { liveTrips, recentBookings, paymentSummary, alerts, todayStats };
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch stats";
      })
      .addCase(fetchDashboardCharts.pending, (state) => {
        state.chartLoading = true;
      })
      .addCase(fetchDashboardCharts.fulfilled, (state, action) => {
        state.chartLoading = false;
        state.charts = action.payload;
      })
      .addCase(fetchDashboardCharts.rejected, (state, action) => {
        state.chartLoading = false;
        state.error = action.error.message || "Failed to fetch chart data";
      })
      .addCase(fetchExtendedDashboard.pending, (state) => {
        state.extendedLoading = true;
      })
      .addCase(fetchExtendedDashboard.fulfilled, (state, action) => {
        state.extendedLoading = false;
        state.liveTrips = action.payload.liveTrips;
        state.recentBookings = action.payload.recentBookings;
        state.paymentSummary = action.payload.paymentSummary;
        state.alerts = action.payload.alerts;
        state.todayStats = action.payload.todayStats;
      })
      .addCase(fetchExtendedDashboard.rejected, (state, action) => {
        state.extendedLoading = false;
        state.error = action.error.message || "Failed to fetch extended data";
      });
  },
});

export default dashboardSlice.reducer;
