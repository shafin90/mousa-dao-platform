import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { useAnalytics } from "../hooks/useAnalytics";
import { AnalyticsFilters } from "../components/AnalyticsFilters";
import type { DateRange } from "../components/AnalyticsFilters";
import { MonthlyRevenueChart } from "../components/MonthlyRevenueChart";
import { RevenueByMethodChart } from "../components/RevenueByMethodChart";
import { BookingTrendsChart } from "../components/BookingTrendsChart";
import { RoutePerformanceChart } from "../components/RoutePerformanceChart";
import { BusUtilizationChart } from "../components/BusUtilizationChart";
import { CancellationChart } from "../components/CancellationChart";
import { PeakTimesChart } from "../components/PeakTimesChart";
import { CustomerAnalytics } from "../components/CustomerAnalytics";
import { ExportSection } from "../components/ExportSection";
import { BookingsChart } from "@/features/dashboard/components/BookingsChart";
import { UserRolesChart } from "@/features/dashboard/components/UserRolesChart";
import { OccupancyChart } from "@/features/dashboard/components/OccupancyChart";

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading, refresh } = useAnalytics();
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-72 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const { stats, revenue, bookingAnalytics, busUtilization, cancellationStats, peakTimes, bookingTrends, monthlyRevenue, routePerformance, userRoles, tripOccupancy, customerMetrics, paymentAnalytics } = data;

  const mostBookedRoute = routePerformance && routePerformance.length > 0
    ? `${routePerformance[0].fromStationName} → ${routePerformance[0].toStationName}`
    : null;

  const summaryCards = [
    { label: t("analytics.totalRevenue"), value: `CFA ${(stats.totalRevenue || 0).toLocaleString()}`, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: t("analytics.totalBookings"), value: stats.totalBookings || 0, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: t("analytics.cancellationRate"), value: `${cancellationStats.cancellationRate || 0}%`, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: t("analytics.paymentSuccess"), value: `${paymentAnalytics.successRate || 0}%`, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: t("analytics.activeBuses"), value: stats.activeBuses || 0, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
    { label: t("analytics.occupancyRate"), value: `${(stats.occupancyRate || 0).toFixed(1)}%`, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { label: t("analytics.totalUsers"), value: stats.totalUsers || 0, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: t("analytics.totalCustomers"), value: customerMetrics?.totalCustomers || 0, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: t("analytics.repeatCustomers"), value: customerMetrics?.repeatCustomers || 0, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: t("analytics.mostBookedRoute"), value: mostBookedRoute || t("common.na"), color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><BarChart3 size={24} /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("analytics.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("analytics.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportSection data={data} />
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      <AnalyticsFilters value={dateRange} onChange={setDateRange} startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyRevenueChart data={monthlyRevenue} />
        </div>
        <RevenueByMethodChart data={revenue.revenueByMethod} />
      </div>

      {/* Booking Analytics */}
      <div>
        <BookingTrendsChart data={bookingTrends} />
      </div>

      {/* Trip Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoutePerformanceChart data={routePerformance} />
        <BusUtilizationChart data={busUtilization} />
      </div>

      {/* Occupancy & Cancellation & Peak Times */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OccupancyChart data={tripOccupancy} />
        <CancellationChart data={cancellationStats} />
        <PeakTimesChart data={peakTimes} />
      </div>

      {/* Customer Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CustomerAnalytics data={customerMetrics} />
        </div>
        <div className="lg:col-span-1">
          <UserRolesChart data={userRoles} />
        </div>
        <div className="lg:col-span-1">
          <BookingsChart data={bookingAnalytics.bookingsByStatus} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
