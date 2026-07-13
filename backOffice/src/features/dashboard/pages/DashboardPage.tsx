import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import { StatsCard } from "../components/StatsCard";
import { LiveTripsTable } from "../components/LiveTripsTable";
import { RecentBookings } from "../components/RecentBookings";
import { PaymentOverview } from "../components/PaymentOverview";
import { AlertsPanel } from "../components/AlertsPanel";
import { QuickActions } from "../components/QuickActions";
import { RevenueMiniChart, BookingsMiniChart } from "../components/MiniCharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { RefreshCw, Wallet, Calendar, Bus, Users, Ticket, CreditCard, TrendingUp, Activity } from "lucide-react";

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, charts, liveTrips, recentBookings, paymentSummary, alerts, todayStats, loading, chartLoading, extendedLoading, refreshStats } = useDashboard();

  const allLoading = loading || !stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={refreshStats} disabled={loading || chartLoading || extendedLoading}>
          <RefreshCw size={16} className={loading || chartLoading || extendedLoading ? "animate-spin" : ""} /> {t("common.refresh")}
        </Button>
      </div>

      {/* KPI Cards */}
      {allLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard title={t("dashboard.kpi.bookingsToday")} value={todayStats?.todayBookings ?? stats.totalBookings} icon={Calendar} />
          <StatsCard title={t("dashboard.kpi.revenueToday")} value={`CFA ${(todayStats?.todayRevenue ?? stats.totalRevenue).toLocaleString()}`} icon={Wallet} />
          <StatsCard title={t("dashboard.kpi.activeTrips")} value={todayStats?.activeTrips ?? stats.totalTrips} icon={Bus} />
          <StatsCard title={t("dashboard.kpi.occupancy")} value={`${(stats.occupancyRate || 0).toFixed(1)}%`} icon={TrendingUp} />
          <StatsCard title={t("dashboard.kpi.passengers")} value={todayStats?.todayPassengers ?? 0} icon={Users} />
          <StatsCard title={t("dashboard.kpi.pendingPayments")} value={todayStats?.pendingPayments ?? 0} icon={CreditCard} />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Trips */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={16} /> {t("dashboard.liveTrips")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/trips')}>{t("dashboard.viewAll")}</Button>
          </CardHeader>
          <CardContent>
            <LiveTripsTable data={liveTrips} loading={extendedLoading} />
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("dashboard.alerts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsPanel data={alerts} loading={extendedLoading} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket size={16} /> {t("dashboard.recentBookings")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>{t("dashboard.viewAll")}</Button>
          </CardHeader>
          <CardContent>
            <RecentBookings data={recentBookings} loading={extendedLoading} />
          </CardContent>
        </Card>

        {/* Payment Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard size={16} /> {t("dashboard.paymentOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentOverview data={paymentSummary} loading={extendedLoading} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>

        {/* Mini Charts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("dashboard.revenueTrend")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-4">
            <RevenueMiniChart data={charts?.dailyRevenue || []} loading={chartLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("dashboard.bookingsTrend")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-4">
            <BookingsMiniChart data={charts?.bookingTrends || []} loading={chartLoading} />
          </CardContent>
        </Card>

        {/* Occupancy Rate Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("dashboard.overallOccupancy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <span className="text-4xl font-bold">{(stats?.occupancyRate || 0).toFixed(1)}%</span>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(stats?.occupancyRate || 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.activeBuses", { count: stats?.activeBuses || 0, total: stats?.totalTrips || 0 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
