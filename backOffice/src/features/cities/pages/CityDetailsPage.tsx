import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Search,
  Edit3,
  X,
  Phone,
  Mail,
  MapPinned,
  User as UserIcon,
  ShieldCheck,
  Clock,
  LayoutDashboard,
  Map,
  Users,
  Settings,
  TrainTrack,
  Navigation,
  Bus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { DataTable } from "@/shared/components/tables/DataTable";
import { cityApi, type CityData } from "@/api/cityApi";
import { stationApi, type StationData } from "@/api/stationApi";
import { routeApi, type RouteData } from "@/api/routeApi";
import { tripApi, type TripData, type TripFilters } from "@/api/tripApi";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

const TRIP_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const SECTIONS = [
  { id: "general", label: "General", icon: LayoutDashboard },
  { id: "address", label: "Address", icon: MapPin },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "management", label: "Team", icon: Users },
  { id: "location", label: "Location", icon: Map },
  { id: "status", label: "Status", icon: Settings },
  { id: "routes", label: "Routes", icon: Navigation },
  { id: "trips", label: "Trips", icon: Bus },
  { id: "stations", label: "Stations", icon: TrainTrack },
] as const;

function getManagerName(m: string | { _id: string; profile: { firstName: string; lastName: string } } | undefined): string {
  if (!m) return "";
  if (typeof m === "string") return "";
  return `${m.profile.firstName} ${m.profile.lastName}`;
}

const CityDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [city, setCity] = useState<CityData | null>(null);
  const [stations, setStations] = useState<StationData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  const [stationSearch, setStationSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [routeSearch, setRouteSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  const [tripFilter, setTripFilter] = useState("");

  const COLUMN_SECTIONS = new Set(["general", "address", "contact", "management", "location", "status"]);

  const filteredStations = stations.filter((s) => {
    if (stationFilter && (s.isActive !== false ? "active" : "inactive") !== stationFilter) return false;
    if (stationSearch) {
      const q = stationSearch.toLowerCase();
      if (!s.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredRoutes = routes.filter((r) => {
    if (routeFilter && (r.isActive !== false ? "active" : "inactive") !== routeFilter) return false;
    if (routeSearch) {
      const q = routeSearch.toLowerCase();
      const from = r.fromCity?.name ?? "";
      const to = r.toCity?.name ?? "";
      if (!from.toLowerCase().includes(q) && !to.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredTrips = trips.filter((t) => {
    if (tripFilter && t.status !== tripFilter) return false;
    if (tripSearch) {
      const q = tripSearch.toLowerCase();
      const from = t.fromStation?.name ?? "";
      const to = t.toStation?.name ?? "";
      const bus = t.busId?.busNumber ?? "";
      if (!from.toLowerCase().includes(q) && !to.toLowerCase().includes(q) && !bus.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cityData = await cityApi.getById(id);
        if (!active) return;
        if (!cityData) { setNotFound(true); return; }
        setCity(cityData);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (activeSection !== "stations") return;
    let active = true;
    (async () => {
      try {
        setStationsLoading(true);
        const stations = await stationApi.getAll({ cityId: id });
        if (active) setStations(stations);
      } catch {
        if (active) setStations([]);
      } finally {
        if (active) setStationsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, activeSection]);

  useEffect(() => {
    if (activeSection !== "routes") return;
    let active = true;
    (async () => {
      try {
        setRoutesLoading(true);
        const data = await routeApi.getAll({ cityId: id });
        if (active) setRoutes(data);
      } catch {
        if (active) setRoutes([]);
      } finally {
        if (active) setRoutesLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, activeSection]);

  useEffect(() => {
    if (activeSection !== "trips") return;
    let active = true;
    (async () => {
      try {
        setTripsLoading(true);
        const data = await tripApi.getAll({ cityId: id } as TripFilters);
        if (active) setTrips(data);
      } catch {
        if (active) setTrips([]);
      } finally {
        if (active) setTripsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, activeSection]);

  const stationColumns = [
    { header: t("stations.stationName"), accessor: (s: StationData) => <span className="font-medium">{s.name}</span> },
    {
      header: t("common.status"),
      accessor: (s: StationData) => (
        <Badge variant={s.isActive !== false ? "success" : "secondary"}>
          {s.isActive !== false ? t("stations.active") : t("stations.inactive")}
        </Badge>
      ),
    },
  ];

  const routeColumns = [
    { header: "From", accessor: (r: RouteData) => <span className="font-medium">{r.fromCity?.name}</span> },
    { header: "To", accessor: (r: RouteData) => <span className="font-medium">{r.toCity?.name}</span> },
    { header: "Distance (km)", accessor: (r: RouteData) => r.distanceKm },
    {
      header: t("common.status"),
      accessor: (r: RouteData) => (
        <Badge variant={r.isActive !== false ? "success" : "secondary"}>
          {r.isActive !== false ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
  ];

  const tripColumns = [
    { header: "Date", accessor: (t: TripData) => new Date(t.date).toLocaleDateString() },
    { header: "From", accessor: (t: TripData) => t.fromStation?.name ?? "—" },
    { header: "To", accessor: (t: TripData) => t.toStation?.name ?? "—" },
    { header: "Bus", accessor: (t: TripData) => t.busId?.busNumber ?? "—" },
    { header: "Price", accessor: (t: TripData) => `${t.price} CFA` },
    {
      header: t("common.status"),
      accessor: (t: TripData) => {
        const variants: Record<string, "success" | "secondary" | "warning" | "default"> = {
          scheduled: "secondary", active: "success", completed: "default", cancelled: "warning",
        };
        return <Badge variant={variants[t.status] || "secondary"}>{t.status}</Badge>;
      },
    },
  ];

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

  if (notFound) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/cities")}>
          <ArrowLeft size={16} /> {t("cities.backToCities")}
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">{t("cities.notFound")}</CardContent>
        </Card>
      </div>
    );
  }

  const createdByDisplay = (() => {
    if (!city?.createdBy) return "—";
    if (typeof city.createdBy === "string") return city.createdBy;
    return `${city.createdBy.profile.firstName} ${city.createdBy.profile.lastName}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/cities")}>
            <ArrowLeft size={16} /> {t("cities.backToCities")}
          </Button>
          {loading ? (
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          ) : (
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Building2 size={22} className="text-primary" />
              <span>{city?.name}</span>
              <Badge variant={city?.isActive !== false ? "success" : "secondary"}>
                {city?.isActive !== false ? t("common.active") : t("common.inactive")}
              </Badge>
            </h1>
          )}
          <p className="font-mono text-xs text-muted-foreground">{city?._id ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeSection === "general" && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/cities/${city?._id}/edit`)}>
              <Edit3 size={16} /> {t("common.edit")}
            </Button>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-1 overflow-x-auto border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeSection === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (<>
      {COLUMN_SECTIONS.has(activeSection) && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {activeSection === "general" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe size={18} className="text-primary" /> Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("cities.cityName"), city!.name, <Building2 size={14} />)}
              {renderField(t("cities.country"), city!.country, <Globe size={14} />)}
            </CardContent>
          </Card>
          )}
          {activeSection === "general" && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-1 p-4">
                <TrainTrack size={20} className="text-primary" />
                <span className="text-2xl font-bold">{stations.length}</span>
                <span className="text-xs text-muted-foreground">{t("cities.stationsInCity")}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-1 p-4">
                <Navigation size={20} className="text-primary" />
                <span className="text-2xl font-bold">{routes.length}</span>
                <span className="text-xs text-muted-foreground">Routes</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-1 p-4">
                <Bus size={20} className="text-primary" />
                <span className="text-2xl font-bold">{trips.length}</span>
                <span className="text-xs text-muted-foreground">Trips</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-1 p-4">
                <ShieldCheck size={20} className={city!.isActive !== false ? "text-green-500" : "text-muted-foreground"} />
                <span className="text-lg font-semibold">{city!.isActive !== false ? t("common.active") : t("common.inactive")}</span>
                <span className="text-xs text-muted-foreground">{t("common.status")}</span>
              </CardContent>
            </Card>
          </div>
          )}

          {activeSection === "address" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin size={18} className="text-primary" /> {t("cities.addressInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {renderField(t("cities.cityName"), city!.name, <Building2 size={14} />)}
                {renderField(t("cities.address1"), city!.address1 || "—", <MapPin size={14} />)}
                {renderField(t("cities.address2"), city!.address2 || "—", <MapPin size={14} />)}
              </div>
            </CardContent>
          </Card>
          )}

          {activeSection === "contact" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone size={18} className="text-primary" /> {t("cities.contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {renderField(t("cities.phone1"), city!.phone1 || "—", <Phone size={14} />)}
                {renderField(t("cities.phone2"), city!.phone2 || "—", <Phone size={14} />)}
                {renderField(t("cities.email1"), city!.email1 || "—", <Mail size={14} />)}
                {renderField(t("cities.email2"), city!.email2 || "—", <Mail size={14} />)}
              </div>
            </CardContent>
          </Card>
          )}

          {activeSection === "management" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon size={18} className="text-primary" /> {t("cities.management")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {renderField(t("cities.manager1"), getManagerName(city!.manager1) || "—", <UserIcon size={14} />)}
                {renderField(t("cities.manager2"), getManagerName(city!.manager2) || "—", <UserIcon size={14} />)}
              </div>
            </CardContent>
          </Card>
          )}

          {activeSection === "location" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned size={18} className="text-primary" /> {t("cities.coordinates")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {renderField(
                  t("cities.coordinates"),
                  city!.location?.lat != null
                    ? `${city!.location.lat.toFixed(6)}, ${city!.location.lng.toFixed(6)}`
                    : "—",
                  <MapPinned size={14} />
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {activeSection === "status" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck size={18} className="text-primary" /> {t("cities.statusSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {renderField(
                  t("cities.status"),
                  <Badge variant={city!.isActive !== false ? "success" : "secondary"}>
                    {city!.isActive !== false ? t("common.active") : t("common.inactive")}
                  </Badge>,
                  <ShieldCheck size={14} />
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        <div className="space-y-6">
          {activeSection === "general" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock size={18} className="text-primary" /> {t("cities.auditInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("cities.createdAt"), city!.createdAt ? new Date(city!.createdAt).toLocaleString() : "—", <Clock size={14} />)}
              {renderField(t("cities.createdBy"), createdByDisplay, <UserIcon size={14} />)}
              {city!.updatedAt && renderField(t("cities.updatedAt"), new Date(city!.updatedAt).toLocaleString(), <Clock size={14} />)}
            </CardContent>
          </Card>
          )}
          {activeSection === "status" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock size={18} className="text-primary" /> {t("cities.auditInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("cities.createdAt"), city!.createdAt ? new Date(city!.createdAt).toLocaleString() : "—", <Clock size={14} />)}
              {renderField(t("cities.createdBy"), createdByDisplay, <UserIcon size={14} />)}
              {city!.updatedAt && renderField(t("cities.updatedAt"), new Date(city!.updatedAt).toLocaleString(), <Clock size={14} />)}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
      )}

      {activeSection === "routes" && (
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Navigation size={18} className="text-primary" /> Routes in this City
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
            <div className="relative flex-1 min-w-[160px] max-w-[260px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Search from/to city..." value={routeSearch} onChange={(e) => setRouteSearch(e.target.value)}
                className="w-full h-7 pl-8 pr-7 rounded border bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              {routeSearch && (
                <button onClick={() => setRouteSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"><X size={12} /></button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}
                className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              {(routeSearch || routeFilter) && (
                <button onClick={() => { setRouteSearch(""); setRouteFilter(""); }}
                  className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"><X size={12} /> Clear</button>
              )}
            </div>
          </div>
          <DataTable className="rounded-t-none border-t-0" columns={routeColumns} data={filteredRoutes} isLoading={routesLoading} onRowClick={(row) => navigate(`/routes/${row._id}`)} />
        </CardContent>
      </Card>
      )}

      {activeSection === "trips" && (
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bus size={18} className="text-primary" /> Trips through this City
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
            <div className="relative flex-1 min-w-[160px] max-w-[260px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Search station or bus..." value={tripSearch} onChange={(e) => setTripSearch(e.target.value)}
                className="w-full h-7 pl-8 pr-7 rounded border bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              {tripSearch && (
                <button onClick={() => setTripSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"><X size={12} /></button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select value={tripFilter} onChange={(e) => setTripFilter(e.target.value)}
                className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >{TRIP_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              {(tripSearch || tripFilter) && (
                <button onClick={() => { setTripSearch(""); setTripFilter(""); }}
                  className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"><X size={12} /> Clear</button>
              )}
            </div>
          </div>
          <DataTable className="rounded-t-none border-t-0" columns={tripColumns} data={filteredTrips} isLoading={tripsLoading} onRowClick={(row) => navigate(`/trips/${row._id}`)} />
        </CardContent>
      </Card>
      )}

      {activeSection === "stations" && (
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin size={18} className="text-primary" /> {t("cities.stationsInCity")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
            <div className="relative flex-1 min-w-[160px] max-w-[260px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Search station name..." value={stationSearch} onChange={(e) => setStationSearch(e.target.value)}
                className="w-full h-7 pl-8 pr-7 rounded border bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              {stationSearch && (
                <button onClick={() => setStationSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"><X size={12} /></button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}
                className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              {(stationSearch || stationFilter) && (
                <button onClick={() => { setStationSearch(""); setStationFilter(""); }}
                  className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"><X size={12} /> Clear</button>
              )}
            </div>
          </div>
          <DataTable className="rounded-t-none border-t-0" columns={stationColumns} data={filteredStations} isLoading={stationsLoading} onRowClick={(row) => navigate(`/stations/${row._id}`)} />
        </CardContent>
      </Card>
      )}
      </>)}
    </div>
  );
};

export default CityDetailsPage;