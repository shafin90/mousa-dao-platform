import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Route as RouteIcon,
  Clock,
  Gauge,
  Ruler,
  Building2,
  CalendarClock,
  Phone,
  Mail,
  User as UserIcon,
  ShieldCheck,
  DollarSign,
  Fingerprint,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { DataTable } from "@/shared/components/tables/DataTable";
import { StopsCard } from "@/shared/components/stops/StopsCard";
import { useAppSelector } from "@/app/store";
import { routeApi, type RouteData, type RouteStop } from "@/api/routeApi";
import { cityApi, type CityData } from "@/api/cityApi";
import { stationApi, type StationData } from "@/api/stationApi";
import { tripApi, type TripData } from "@/api/tripApi";

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; hint?: string }> = ({
  icon,
  label,
  value,
  hint,
}) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const renderField = (
  label: string,
  value: React.ReactNode,
  icon?: React.ReactNode
) => (
  <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
    <span className="flex items-center gap-2 text-muted-foreground">
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </span>
    <span className="text-right font-medium">{value}</span>
  </div>
);

const formatDuration = (minutes?: number): string => {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const statusVariant = (status: TripData["status"]) => {
  switch (status) {
    case "active":
      return "success" as const;
    case "completed":
      return "secondary" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "warning" as const;
  }
};

function getUserName(
  u: string | { _id: string; profile: { firstName: string; lastName: string } } | undefined
): string {
  if (!u) return "—";
  if (typeof u === "string") return u;
  return `${u.profile.firstName} ${u.profile.lastName}`;
}

function getStationName(
  s: string | { _id: string; name: string } | undefined
): string {
  if (!s) return "";
  if (typeof s === "string") return "";
  return s.name;
}

const RouteDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const routeFromStore = useAppSelector((s) => s.routes.routes.find((r) => r._id === id));
  const [route, setRoute] = useState<RouteData | null>(routeFromStore ?? null);
  const [cities, setCities] = useState<CityData[]>([]);
  const [stations, setStations] = useState<StationData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(!routeFromStore);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [routeData, cityData, stationData] = await Promise.all([
          routeApi.getById(id).catch(() => routeFromStore ?? null),
          cityApi.getAll().catch(() => [] as CityData[]),
          stationApi.getAll().catch(() => [] as StationData[]),
        ]);
        if (!active) return;
        if (!routeData) {
          setNotFound(true);
        } else {
          setRoute(routeData);
        }
        setCities(cityData);
        setStations(stationData);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, routeFromStore]);

  useEffect(() => {
    let active = true;
    (async () => {
      setTripsLoading(true);
      try {
        const data = await tripApi.getAll({ routeId: id });
        if (active) setTrips(data);
      } catch {
        if (active) setTrips([]);
      } finally {
        if (active) setTripsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const fromCity = useMemo(
    () => cities.find((c) => c._id === idOf(route?.fromCity)),
    [cities, route]
  );
  const toCity = useMemo(
    () => cities.find((c) => c._id === idOf(route?.toCity)),
    [cities, route]
  );

  const fromStationNames = useMemo(
    () => (route?.fromStations || []).map((s) => getStationName(s)).filter(Boolean).join(", "),
    [route]
  );

  const toStationNames = useMemo(
    () => (route?.toStations || []).map((s) => getStationName(s)).filter(Boolean).join(", "),
    [route]
  );

  const metrics = useMemo(() => {
    if (!route) return null;
    const avgSpeed =
      route.estimatedTimeMinutes && route.estimatedTimeMinutes > 0
        ? route.distanceKm / (route.estimatedTimeMinutes / 60)
        : null;
    const upcoming = trips.filter((tr) => tr.status === "scheduled" || tr.status === "active").length;
    const seatsTotal = trips.reduce((acc, tr) => acc + (tr.seatsTotal || 0), 0);
    const seatsBooked = trips.reduce((acc, tr) => acc + (tr.seatsBooked || 0), 0);
    const occupancy = seatsTotal > 0 ? (seatsBooked / seatsTotal) * 100 : null;
    return { avgSpeed, upcoming, occupancy };
  }, [route, trips]);

  const tripColumns = [
    { header: t("trips.date"), accessor: (tr: TripData) => new Date(tr.date).toLocaleDateString() },
    {
      header: t("routes.schedule"),
      accessor: (tr: TripData) => `${tr.departureTime} → ${tr.arrivalTime}`,
    },
    {
      header: t("trips.bus"),
      accessor: (tr: TripData) => tr.busId?.busNumber || tr.busId?.name || t("common.na"),
    },
    {
      header: t("trips.price"),
      accessor: (tr: TripData) => <span className="font-medium">CFA {tr.price?.toFixed(2) ?? "0.00"}</span>,
    },
    {
      header: t("trips.seats"),
      accessor: (tr: TripData) => `${tr.seatsBooked ?? 0}/${tr.seatsTotal ?? 0}`,
    },
    {
      header: t("common.status"),
      accessor: (tr: TripData) => (
        <Badge variant={statusVariant(tr.status)}>{t(`trips.${tr.status}`)}</Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !route) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/routes")}>
          <ArrowLeft size={16} /> {t("routes.backToRoutes")}
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">{t("routes.notFound")}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/routes")}>
            <ArrowLeft size={16} /> {t("routes.backToRoutes")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <RouteIcon size={22} className="text-primary" />
            <span>{fromCity?.name || route.fromCity?.name || t("common.na")}</span>
            <span className="text-muted-foreground">→</span>
            <span>{toCity?.name || route.toCity?.name || t("common.na")}</span>
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{t("routes.routeId")}: {route._id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={route.isActive !== false ? "success" : "secondary"}>
            {route.isActive !== false ? t("routes.active") : t("routes.inactive")}
          </Badge>
          <Button
            className="gap-2"
            onClick={() => {
              navigate("/routes", { state: { editRouteId: route._id } });
              toast.info(t("routes.editFromList"));
            }}
          >
            <Pencil size={16} /> {t("common.edit")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Ruler size={18} />}
          label={t("routes.distance")}
          value={t("routes.distanceValue", { value: route.distanceKm })}
        />
        <StatCard
          icon={<Clock size={18} />}
          label={t("routes.estTime")}
          value={route.estimatedTimeMinutes ? formatDuration(route.estimatedTimeMinutes) : t("common.na")}
          hint={route.estimatedTimeMinutes ? t("routes.estTimeMinutes") : undefined}
        />
        {metrics?.avgSpeed != null && (
          <StatCard
            icon={<Gauge size={18} />}
            label={t("routes.avgSpeed")}
            value={t("routes.speedValue", { value: metrics.avgSpeed.toFixed(1) })}
          />
        )}
        <StatCard
          icon={<DollarSign size={18} />}
          label={t("routes.baseRate")}
          value={route.baseRate ? `CFA ${route.baseRate}` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 size={18} className="text-primary" /> {t("routes.departureCity")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("routes.departureCity"), fromCity?.name || route.fromCity?.name || "—", <MapPin size={14} />)}
              {fromCity?.country && renderField(t("cities.country"), fromCity.country, <MapPin size={14} />)}
              {renderField(t("routes.fromStations"), fromStationNames || "—", <Home size={14} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 size={18} className="text-primary" /> {t("routes.destinationCity")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("routes.destinationCity"), toCity?.name || route.toCity?.name || "—", <MapPin size={14} />)}
              {toCity?.country && renderField(t("cities.country"), toCity.country, <MapPin size={14} />)}
              {renderField(t("routes.toStations"), toStationNames || "—", <Home size={14} />)}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign size={18} className="text-primary" /> {t("routes.baseRate")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("routes.baseRate"), route.baseRate ? `CFA ${route.baseRate}` : "—", <DollarSign size={14} />)}
              {renderField(t("routes.distance"), t("routes.distanceValue", { value: route.distanceKm }), <Ruler size={14} />)}
              {renderField(t("routes.estTime"), route.estimatedTimeMinutes ? formatDuration(route.estimatedTimeMinutes) : "—", <Clock size={14} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck size={18} className="text-primary" /> {t("routes.status")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(
                t("routes.status"),
                <Badge variant={route.isActive !== false ? "success" : "secondary"}>
                  {route.isActive !== false ? t("routes.active") : t("routes.inactive")}
                </Badge>,
                <ShieldCheck size={14} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock size={18} className="text-primary" /> {t("cities.auditInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("routes.createdAt"), new Date(route.createdAt).toLocaleString(), <CalendarClock size={14} />)}
              {renderField(t("routes.createdBy"), getUserName(route.createdBy as never), <UserIcon size={14} />)}
              {route.updatedAt && renderField(t("routes.updatedAt"), new Date(route.updatedAt).toLocaleString(), <Clock size={14} />)}
              {renderField(t("routes.routeId"), route._id, <Fingerprint size={14} />)}
            </CardContent>
          </Card>
        </div>
      </div>

      <StopsCard stops={route.stops ?? []} cities={cities} stations={stations} />

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">{t("routes.tripsOnRoute")}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {t("routes.totalTrips", { count: trips.length })}
            </Badge>
            {metrics && (
              <Badge variant="secondary">{t("routes.upcomingTrips", { count: metrics.upcoming })}</Badge>
            )}
            {metrics?.occupancy != null && (
              <Badge variant="success">
                {t("routes.occupancy", { value: metrics.occupancy.toFixed(0) })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={tripColumns} data={trips} isLoading={tripsLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteDetailsPage;
