import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchDashboardStats, fetchDashboardCharts, fetchExtendedDashboard } from "../store/dashboardSlice";

export const useDashboard = () => {
  const dispatch = useAppDispatch();
  const { stats, charts, liveTrips, recentBookings, paymentSummary, alerts, todayStats, loading, chartLoading, extendedLoading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    if (!stats) dispatch(fetchDashboardStats());
  }, [dispatch, stats]);

  useEffect(() => {
    if (!charts) dispatch(fetchDashboardCharts());
  }, [dispatch, charts]);

  useEffect(() => {
    if (liveTrips.length === 0) dispatch(fetchExtendedDashboard());
  }, [dispatch, liveTrips.length]);

  const refreshStats = useCallback(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchDashboardCharts());
    dispatch(fetchExtendedDashboard());
  }, [dispatch]);

  return { stats, charts, liveTrips, recentBookings, paymentSummary, alerts, todayStats, loading, chartLoading, extendedLoading, error, refreshStats };
};
