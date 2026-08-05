import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import { StatsCard } from "../components/StatsCard";
import { RecentBookings } from "../components/RecentBookings";
import { PaymentOverview } from "../components/PaymentOverview";
import { AlertsPanel } from "../components/AlertsPanel";
import { QuickActions } from "../components/QuickActions";
import { RevenueMiniChart, BookingsMiniChart } from "../components/MiniCharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import {
  RefreshCw, Wallet, Calendar, Bus, Users, Ticket, CreditCard, TrendingUp,
  ArrowRight, Clock, Sparkles, Target, CircleDot, Route, MapPin, Plus,
  Percent, UsersRound, Building2, AlertTriangle, CheckCircle2, Flame
} from "lucide-react";
import { useAppSelector } from "@/app/store";
import { cn } from "@/shared/utils/cn";

const STATUS_VARIANT: Record<string, "default" | "success" | "secondary" | "destructive"> = {
  active: "success",
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const {
    stats, charts, liveTrips = [], recentBookings, paymentSummary, alerts, todayStats,
    loading, chartLoading, extendedLoading, refreshStats,
  } = useDashboard();

  const allLoading = loading || !stats;
  const hourlyRunRate = (todayStats?.todayRevenue ?? 0) / Math.max(new Date().getHours(), 1);
  const occupancy = stats?.occupancyRate ?? 0;
  const occupancyLow = occupancy < 60;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greeting") + " " + "morning";
    if (h < 17) return t("dashboard.greeting") + " " + "afternoon";
    return t("dashboard.greeting") + " " + "evening";
  })();

  const fullName = user
    ? `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || user.email
    : "";

  const topRoutes = (charts?.topRoutes || []).slice(0, 5);

  return (
    <div className="space-y-6 pb-8">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/95 via-primary to-indigo-700 text-primary-foreground shadow-lg">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur hover:bg-white/25">
                <Sparkles size={12} className="mr-1" /> {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              </Badge>
              {user?.role && (
                <Badge className="bg-white/15 text-white/90 border-white/20 backdrop-blur capitalize">
                  {t(`roles.${user.role}`, { defaultValue: user.role })}
                </Badge>
              )}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {greeting}, {fullName} 👋
              </h2>
              <p className="mt-1 max-w-2xl text-white/85 text-sm sm:text-base">
                {t("dashboard.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Ticket size={12} /> {t("dashboard.kpi.bookingsToday")}
                </div>
                <div className="mt-1 text-lg font-bold">{todayStats?.todayBookings ?? 0}</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Wallet size={12} /> {t("dashboard.kpi.revenueToday")}
                </div>
                <div className="mt-1 text-lg font-bold">CFA {(todayStats?.todayRevenue ?? 0).toLocaleString()}</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Bus size={12} /> {t("dashboard.kpi.activeTrips")}
                </div>
                <div className="mt-1 text-lg font-bold">{todayStats?.activeTrips ?? 0}</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Users size={12} /> {t("dashboard.kpi.passengers")}
                </div>
                <div className="mt-1 text-lg font-bold">{todayStats?.todayPassengers ?? 0}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-md gap-2"
              onClick={() => navigate("/trips")}
            >
              <Plus size={16} /> {t("dashboard.scheduleTrip")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-2 backdrop-blur"
              onClick={refreshStats}
              disabled={loading || chartLoading || extendedLoading}
            >
              <RefreshCw size={14} className={loading || chartLoading || extendedLoading ? "animate-spin" : ""} />
              {t("dashboard.updatedAt")} {new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </Button>
          </div>
        </div>
      </div>

      {/* 9 KPI CARDS — 3×3 */}
      {allLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title={t("dashboard.kpi.revenueToday")}
            value={`CFA ${(todayStats?.todayRevenue ?? 0).toLocaleString()}`}
            icon={Wallet}
            description={t("dashboard.kpiHint.revenueToday")}
            className="ring-1 ring-emerald-500/20"
          />
          <StatsCard
            title={t("dashboard.kpi.bookingsToday")}
            value={todayStats?.todayBookings ?? stats.totalBookings}
            icon={Ticket}
            description={t("dashboard.kpiHint.bookingsToday")}
            trend={{ value: Math.round(((todayStats?.todayBookings ?? 0) / Math.max((stats.totalBookings || 1) / 30, 1) - 1) * 100), isUp: (todayStats?.todayBookings ?? 0) >= Math.max(Math.floor((stats.totalBookings || 1) / 90), 1) }}
          />
          <StatsCard
            title={t("dashboard.kpi.activeTrips")}
            value={todayStats?.activeTrips ?? stats.totalTrips}
            icon={Bus}
            description={t("dashboard.kpiHint.activeTrips")}
          />
          <StatsCard
            title={t("dashboard.kpi.occupancy")}
            value={`${occupancy.toFixed(1)}%`}
            icon={Percent}
            description={t("dashboard.kpiHint.occupancy")}
            trend={{ value: Math.round(occupancy), isUp: occupancy >= 60 }}
            className={cn(occupancyLow && "ring-1 ring-amber-500/20")}
          />
          <StatsCard
            title={t("dashboard.kpi.passengers")}
            value={todayStats?.todayPassengers ?? 0}
            icon={Users}
            description={t("dashboard.kpiHint.passengersToday")}
          />
          <StatsCard
            title={t("dashboard.kpi.pendingPayments")}
            value={todayStats?.pendingPayments ?? 0}
            icon={CreditCard}
            description={t("dashboard.kpiHint.pendingPayments")}
            className={(todayStats?.pendingPayments ?? 0) > 0 ? "ring-1 ring-amber-500/20" : undefined}
          />
          <StatsCard
            title={t("dashboard.kpi.totalRevenue")}
            value={`CFA ${(stats.totalRevenue ?? 0).toLocaleString()}`}
            icon={TrendingUp}
            description={t("dashboard.kpiHint.totalRevenue")}
            className="ring-1 ring-indigo-500/20"
          />
          <StatsCard
            title={t("dashboard.kpi.totalBuses")}
            value={stats.activeBuses ?? 0}
            icon={Building2}
            description={t("dashboard.kpiHint.totalBuses")}
          />
          <StatsCard
            title={t("dashboard.kpi.totalCustomers")}
            value={stats.totalUsers ?? 0}
            icon={UsersRound}
            description={t("dashboard.kpiHint.totalCustomers")}
          />
        </div>
      )}

      {/* LIVE TRIPS SECTION */}
      <Card className="border-emerald-500/20">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CircleDot size={18} />
              </span>
              {t("dashboard.liveTrips")}
              <Badge variant="secondary" className="ml-1">{liveTrips.length}</Badge>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {t("dashboard.activeBuses", { count: stats?.activeBuses || 0, total: stats?.totalTrips || 0 })}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/trips")} className="gap-1.5">
            {t("dashboard.viewAll")} <ArrowRight size={14} />
          </Button>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {extendedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 px-6 pb-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : liveTrips.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No trips scheduled for today.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 px-6 pb-6">
              {liveTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="group relative rounded-xl border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => navigate(`/trips/${trip._id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("dashboard.liveTripsBus")}</p>
                      <p className="font-semibold text-sm line-clamp-1">{trip.bus}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[trip.status] || "secondary"} className="capitalize text-[10px]">
                      {t(`dashboard.${trip.status}`, { defaultValue: trip.status })}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <MapPin size={13} className="shrink-0 text-primary" />
                    <span className="font-medium line-clamp-1">{trip.route}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {trip.departureTime}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ticket size={12} />
                      {trip.seatsBooked}/{trip.seatsTotal} seats
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        trip.occupancyRate >= 85 ? "bg-rose-500" :
                        trip.occupancyRate >= 60 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(trip.occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ATTENTION REQUIRED + TOP ROUTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={cn(
          "lg:col-span-2 transition-colors",
          alerts.length > 0 ? "border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10" : "border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/10"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {alerts.length > 0 ? (
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600">
                  <AlertTriangle size={18} />
                </span>
              ) : (
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600">
                  <CheckCircle2 size={18} />
                </span>
              )}
              {alerts.length > 0 ? t("dashboard.alerts") : t("dashboard.insights")}
            </CardTitle>
            <CardDescription className="text-xs">
              {alerts.length === 0 ? t("dashboard.alertsNone") : `${alerts.length} active`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <AlertsPanel data={alerts} loading={extendedLoading} />
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border bg-white dark:bg-card p-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0">
                    <Target size={18} />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">{t("dashboard.overallOccupancy")}: {occupancy.toFixed(1)}%</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {occupancyLow ? t("dashboard.occupancyLow") : t("dashboard.occupancyGood")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border bg-white dark:bg-card p-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 shrink-0">
                    <Flame size={18} />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">{t("dashboard.runRateDaily")}: CFA {Math.round((todayStats?.todayRevenue ?? 0)).toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Avg hourly today: CFA {Math.round(hourlyRunRate).toLocaleString()}
                    </p>
                  </div>
                </div>
                {paymentSummary && (
                  <div className="flex items-start gap-3 rounded-xl border bg-white dark:bg-card p-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                      <CreditCard size={18} />
                    </span>
                    <div className="text-sm">
                      <p className="font-medium">{t("paymentOverview.successRate", { defaultValue: "Payment Success Rate" })}: {paymentSummary.successRate}%</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {paymentSummary.successful} / {paymentSummary.total} transactions cleared
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Route size={18} />
                </span>
                {t("dashboard.topRoutes")}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/routes")} className="gap-1.5 text-xs">
              {t("dashboard.manage")} <ArrowRight size={13} />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {chartLoading || !topRoutes.length ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <ol className="space-y-3">
                {topRoutes.map((r, idx) => {
                  const fromTo = r.route?.[0]
                    ? `${r.route[0].fromStation || "—"} → ${r.route[0].toStation || "—"}`
                    : r._id;
                  const max = topRoutes[0]?.count || 1;
                  return (
                    <li key={r._id} className="group cursor-pointer" onClick={() => navigate("/routes")}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold shrink-0",
                            idx === 0 ? "bg-amber-500/15 text-amber-700" :
                            idx === 1 ? "bg-slate-300/40 text-slate-700" :
                            idx === 2 ? "bg-orange-600/15 text-orange-700" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium truncate">{fromTo}</span>
                        </div>
                        <span className="text-sm font-bold shrink-0">{r.count}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all"
                          style={{ width: `${(r.count / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* LATEST BOOKINGS + PAYMENT HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                <Calendar size={18} />
              </span>
              {t("dashboard.recentBookings")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} className="gap-1.5">
              {t("dashboard.viewAll")} <ArrowRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            <RecentBookings data={recentBookings} loading={extendedLoading} onRowClick={(b) => navigate(`/bookings/${b._id}`)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CreditCard size={18} />
              </span>
              {t("dashboard.paymentOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentOverview data={paymentSummary} loading={extendedLoading} />
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS + MINI CHARTS + OCCUPANCY GAUGE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-600">
                <Sparkles size={18} />
              </span>
              {t("dashboard.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("dashboard.overallOccupancy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full gap-3 py-2">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-muted" />
                <div
                  className="absolute inset-0 rounded-full bg-conic transition-all"
                  style={{
                    background: `conic-gradient(${occupancy >= 85 ? '#f43f5e' : occupancy >= 60 ? '#10b981' : '#f59e0b'} ${Math.min(occupancy, 100) * 3.6}deg, hsl(var(--muted)) 0)`,
                    maskImage: 'radial-gradient(circle, transparent 58%, black 60%)',
                    WebkitMaskImage: 'radial-gradient(circle, transparent 58%, black 60%)',
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{occupancy.toFixed(0)}%</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Occupied</span>
                </div>
              </div>
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("dashboard.kpi.totalBuses")}</span>
                  <span className="font-semibold text-foreground">{stats?.activeBuses ?? 0}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(((stats?.activeBuses ?? 0) / Math.max(stats?.totalTrips || 1, 1)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {t("dashboard.activeBuses", { count: stats?.activeBuses || 0, total: stats?.totalTrips || 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
