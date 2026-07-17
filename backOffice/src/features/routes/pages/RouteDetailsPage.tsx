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
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { RouteMap } from "@/shared/components/maps/RouteMap";
import { DataTable } from "@/shared/components/tables/DataTable";
import { StopsCard } from "@/shared/components/stops/StopsCard";
import { useAppSelector } from "@/app/store";
import { routeApi, type RouteData } from "@/api/routeApi";
import { stationApi, type StationData } from "@/api/stationApi";
import { cityApi, type CityData } from "@/api/cityApi";
import { tripApi, type TripData } from "@/api/tripApi";

/** Extracts an id from a value that is either a populated object or a raw id string. */
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

const StationCard: React.FC<{ title: string; accent: string; station?: StationData; fallback: string }> = ({
  title,
  accent,
  station,
  fallback,
}) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${accent}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-lg font-semibold">{station?.name || fallback}</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 size={14} />
          <span>{station?.cityId?.name || t("common.na")}</span>
          {station && (
            <Badge variant={station.isActive ? "success" : "secondary"} className="ml-1">
              {station.isActive ? t("stations.active") : t("stations.inactive")}
            </Badge>
          )}
        </div>
        {station?.address && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <span>{station.address}</span>
          </div>
        )}
        {station?.location && (
          <p className="font-mono text-xs text-muted-foreground">
            {station.location.lat.toFixed(5)}, {station.location.lng.toFixed(5)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

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

const RouteDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const routeFromStore = useAppSelector((s) => s.routes.routes.find((r) => r._id === id));
  const [route, setRoute] = useState<RouteData | null>(routeFromStore ?? null);
  const [stations, setStations] = useState<StationData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(!routeFromStore);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [routeData, stationData, cityData] = await Promise.all([
          routeApi.getById(id).catch(() => routeFromStore ?? null),
          stationApi.getAll().catch(() => [] as StationData[]),
          cityApi.getAll().catch(() => [] as CityData[]),
        ]);
        if (!active) return;
        if (!routeData) {
          setNotFound(true);
        } else {
          setRoute(routeData);
        }
        setStations(stationData);
        setCities(cityData);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    return () => {
      active = false;
    };
  }, [id]);

  const fromStation = useMemo(
    () => stations.find((s) => s._id === idOf(route?.fromStation)),
    [stations, route]
  );
  const toStation = useMemo(
    () => stations.find((s) => s._id === idOf(route?.toStation)),
    [stations, route]
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

  const canRenderMap = !!(fromStation?.location && toStation?.location);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/routes")}>
            <ArrowLeft size={16} /> {t("routes.backToRoutes")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <RouteIcon size={22} className="text-primary" />
            <span>{fromStation?.name || route.fromStation?.name || t("common.na")}</span>
            <span className="text-muted-foreground">→</span>
            <span>{toStation?.name || route.toStation?.name || t("common.na")}</span>
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{route._id}</p>
        </div>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Ruler size={18} />}
          label={t("routes.distance")}
          value={t("routes.distanceValue", { value: route.distanceKm })}
        />

        <StatCard
          icon={<Clock size={18} />}
          label={t("routes.estTime")}
          value={formatDuration(route.estimatedTimeMinutes)}
        />
        <StatCard
          icon={<Gauge size={18} />}
          label={t("routes.avgSpeed")}
          value={metrics?.avgSpeed != null ? `${metrics.avgSpeed.toFixed(0)} km/h` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StationCard
          title={t("routes.fromStation")}
          accent="bg-emerald-500"
          station={fromStation}
          fallback={route.fromStation?.name || t("common.na")}
        />
        <StationCard
          title={t("routes.toStation")}
          accent="bg-blue-500"
          station={toStation}
          fallback={route.toStation?.name || t("common.na")}
        />
      </div>

      {canRenderMap && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin size={18} className="text-primary" /> {t("routes.mapTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RouteMap
              from={{ lat: fromStation!.location.lat, lng: fromStation!.location.lng }}
              to={{ lat: toStation!.location.lat, lng: toStation!.location.lng }}
              fromLabel={fromStation!.name}
              toLabel={toStation!.name}
            />
          </CardContent>
        </Card>
      )}

      <StopsCard stops={route.stops ?? []} cities={cities} />

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

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">{t("routes.createdAt")}:</span>
            <span className="font-medium">{new Date(route.createdAt).toLocaleString()}</span>
          </div>
          {route.updatedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarClock size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">{t("routes.updatedAt")}:</span>
              <span className="font-medium">{new Date(route.updatedAt).toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteDetailsPage;
