import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  MapPin,
  Globe,
  Home,
  Activity,
  CalendarClock,
  Building2,
  Phone,
  Mail,
  MapPinned,
  User as UserIcon,
  ShieldCheck,
  Clock,
  Fingerprint,
  LayoutDashboard,
  Map,
  Users,
  Settings,
  Bus,
  Route,
  Calendar,
  Pencil,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { stationApi, type StationData } from "@/api/stationApi";
import { tripApi, type TripData } from "@/api/tripApi";
import { routeApi, type RouteData } from "@/api/routeApi";
import { busApi, type BusData } from "@/api/busApi";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";

const SECTIONS = (t: (key: string) => string) => [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "address", label: "Address", icon: MapPin },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "management", label: "Management", icon: Users },
  { id: "trips", label: t("stations.trips"), icon: Calendar },
  { id: "routes", label: t("stations.routes"), icon: Route },
  { id: "buses", label: t("stations.buses"), icon: Bus },
  { id: "location", label: "Location", icon: Map },
  { id: "status", label: "Status", icon: Settings },
] as const;

function getManagerName(
  m: string | { _id: string; profile: { firstName: string; lastName: string } } | undefined
): string {
  if (!m) return "";
  if (typeof m === "string") return "";
  return `${m.profile.firstName} ${m.profile.lastName}`;
}

function getUserName(
  u: string | { _id: string; profile: { firstName: string; lastName: string } } | undefined
): string {
  if (!u) return "—";
  if (typeof u === "string") return u;
  return `${u.profile.firstName} ${u.profile.lastName}`;
}

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

const StatsCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
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
        </div>
      </div>
    </CardContent>
  </Card>
);

const StationDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [station, setStation] = useState<StationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [trips, setTrips] = useState<TripData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const { showError } = useErrorModal();

  const startEdit = useCallback(() => {
    if (!station) return;
    setDraft({});
    setEditing(true);
  }, [station]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft({});
  }, []);

  const saveEdit = useCallback(async () => {
    if (!station) return;
    try {
      let payload: Record<string, unknown> = {};
      if (activeSection === "address") {
        payload = { address1: draft.address1 || undefined, address2: draft.address2 || undefined };
      } else if (activeSection === "contact") {
        payload = { phone1: draft.phone1 || undefined, phone2: draft.phone2 || undefined, email1: draft.email1 || undefined, email2: draft.email2 || undefined };
      } else if (activeSection === "management") {
        payload = { manager1: draft.manager1 || undefined, manager2: draft.manager2 || undefined };
      } else if (activeSection === "location") {
        payload = { location: { lat: Number(draft.lat), lng: Number(draft.lng) } };
      } else if (activeSection === "status") {
        payload = { isActive: draft.isActive === "true" };
      }
      const updated = await stationApi.update(station._id, payload);
      setStation(updated);
      toast.success(t("stations.updated"));
      setEditing(false);
      setDraft({});
    } catch {
      showError(t("stations.updateFailed"));
    }
  }, [station, activeSection, draft, showError, t]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stationData = await stationApi.getById(id);
        if (!active) return;
        if (!stationData) {
          setNotFound(true);
        } else {
          setStation(stationData);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!station) return;
    setRelatedLoading(true);
    const stationId = station._id;
    Promise.all([
      tripApi.getAll({ fromStation: stationId }),
      tripApi.getAll({ toStation: stationId }),
      routeApi.getAll(),
      busApi.getAll(),
    ]).then(([fromTrips, toTrips, allRoutes, busResult]) => {
      const allTrips = [...(fromTrips || []), ...(toTrips || [])];
      const seen = new Set<string>();
      const uniqueTrips = allTrips.filter((t) => { if (seen.has(t._id)) return false; seen.add(t._id); return true; });
      setTrips(uniqueTrips);

      const stationObjId = stationId;
      const relatedRoutes = (allRoutes || []).filter((r) => {
        const inFrom = r.fromStations?.some((s) => s._id === stationObjId);
        const inTo = r.toStations?.some((s) => s._id === stationObjId);
        const inStops = r.stops?.some((s) => s.stationId && (typeof s.stationId === "object" ? s.stationId._id : s.stationId) === stationObjId);
        return inFrom || inTo || inStops;
      });
      setRoutes(relatedRoutes);

      const busIds = new Set(uniqueTrips.map((t) => t.busId?._id).filter(Boolean));
      const relatedBuses = (busResult.buses || []).filter((b) => busIds.has(b._id));
      setBuses(relatedBuses);
    }).catch(() => {
      setTrips([]);
      setRoutes([]);
      setBuses([]);
    }).finally(() => setRelatedLoading(false));
  }, [station]);

  useEffect(() => {
    if (!station || !mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const lat = station.location.lat;
    const lng = station.location.lng;
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);
    const marker = L.marker([lat, lng], { draggable: false }).addTo(map);
    markerRef.current = marker;
    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [station]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !station) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/stations")}>
          <ArrowLeft size={16} /> {t("stations.backToStations")}
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">{t("stations.notFound")}</CardContent>
        </Card>
      </div>
    );
  }

  const countryName =
    (typeof station.cityId === "object" && station.cityId?.country) || "—";
  const cityName =
    (typeof station.cityId === "object" && station.cityId?.name) || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/stations")}>
            <ArrowLeft size={16} /> {t("stations.backToStations")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MapPin size={22} className="text-primary" />
            <span>{station.name}</span>
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{t("stations.stationId")}: {station._id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={station.isActive !== false ? "success" : "secondary"} className="w-fit">
            {station.isActive !== false ? t("stations.active") : t("stations.inactive")}
          </Badge>
          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit}>{t("common.cancel")}</Button>
              <Button size="sm" className="gap-2" onClick={saveEdit}><Pencil size={14} /> {t("common.save")}</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-2" onClick={startEdit}>
              <Pencil size={14} /> {t("common.edit")}
            </Button>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-1 overflow-x-auto border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {SECTIONS(t).map(({ id, label, icon: Icon }) => (
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

      {activeSection === "overview" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard icon={<Globe size={18} />} label={t("stations.country")} value={countryName} />
          <StatsCard icon={<Building2 size={18} />} label={t("stations.city")} value={cityName} />
          <StatsCard
            icon={<MapPinned size={18} />}
            label={t("stations.coordinates")}
            value={`${station.location.lat.toFixed(4)}, ${station.location.lng.toFixed(4)}`}
          />
          <StatsCard
            icon={<Activity size={18} />}
            label={t("common.status")}
            value={station.isActive !== false ? t("stations.active") : t("stations.inactive")}
          />
        </div>
      )}

      {activeSection === "address" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Home size={18} className="text-primary" /> {t("stations.addressInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {editing ? (
                <>
                  {renderField(t("stations.address1"), <input type="text" value={draft.address1 ?? station.address1 ?? ""} onChange={(e) => setDraft({ ...draft, address1: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />, <MapPin size={14} />)}
                  {renderField(t("stations.address2"), <input type="text" value={draft.address2 ?? station.address2 ?? ""} onChange={(e) => setDraft({ ...draft, address2: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />, <MapPin size={14} />)}
                </>
              ) : (
                <>
                  {renderField(t("stations.address1"), station.address1 || "—", <MapPin size={14} />)}
                  {renderField(t("stations.address2"), station.address2 || "—", <MapPin size={14} />)}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "contact" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone size={18} className="text-primary" /> {t("stations.contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {editing ? (
                <>
                  {renderField(t("stations.phone1"), <input type="tel" value={draft.phone1 ?? station.phone1 ?? ""} onChange={(e) => setDraft({ ...draft, phone1: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />, <Phone size={14} />)}
                  {renderField(t("stations.phone2"), <input type="tel" value={draft.phone2 ?? station.phone2 ?? ""} onChange={(e) => setDraft({ ...draft, phone2: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />, <Phone size={14} />)}
                  {renderField(t("stations.email1"), <input type="email" value={draft.email1 ?? station.email1 ?? ""} onChange={(e) => setDraft({ ...draft, email1: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />, <Mail size={14} />)}
                  {renderField(t("stations.email2"), <input type="email" value={draft.email2 ?? station.email2 ?? ""} onChange={(e) => setDraft({ ...draft, email2: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />, <Mail size={14} />)}
                </>
              ) : (
                <>
                  {renderField(t("stations.phone1"), station.phone1 || "—", <Phone size={14} />)}
                  {renderField(t("stations.phone2"), station.phone2 || "—", <Phone size={14} />)}
                  {renderField(t("stations.email1"), station.email1 || "—", <Mail size={14} />)}
                  {renderField(t("stations.email2"), station.email2 || "—", <Mail size={14} />)}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "management" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon size={18} className="text-primary" /> {t("stations.management")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {editing ? (
                <>
                  {renderField(t("stations.manager1"), <input type="text" value={draft.manager1 ?? (typeof station.manager1 === "object" ? `${station.manager1.profile.firstName} ${station.manager1.profile.lastName}` : station.manager1 || "")} onChange={(e) => setDraft({ ...draft, manager1: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />, <UserIcon size={14} />)}
                  {renderField(t("stations.manager2"), <input type="text" value={draft.manager2 ?? (typeof station.manager2 === "object" ? `${station.manager2.profile.firstName} ${station.manager2.profile.lastName}` : station.manager2 || "")} onChange={(e) => setDraft({ ...draft, manager2: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />, <UserIcon size={14} />)}
                </>
              ) : (
                <>
                  {renderField(t("stations.manager1"), getManagerName(station.manager1) || "—", <UserIcon size={14} />)}
                  {renderField(t("stations.manager2"), getManagerName(station.manager2) || "—", <UserIcon size={14} />)}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "trips" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar size={18} className="text-primary" /> Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {relatedLoading ? (
              <div className="flex h-20 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" /></div>
            ) : trips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trips found for this station.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Route</th>
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Departure</th>
                      <th className="pb-2 pr-4 font-medium">Arrival</th>
                      <th className="pb-2 pr-4 font-medium">Bus</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip._id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/trips/${trip._id}`)}>
                        <td className="py-2 pr-4">
                          {trip.routeId ? `${trip.routeId.fromCity?.name || "—"} → ${trip.routeId.toCity?.name || "—"}` : "—"}
                        </td>
                        <td className="py-2 pr-4">{trip.date ? new Date(trip.date).toLocaleDateString() : "—"}</td>
                        <td className="py-2 pr-4">{trip.departureTime || "—"}</td>
                        <td className="py-2 pr-4">{trip.arrivalTime || "—"}</td>
                        <td className="py-2 pr-4">{trip.busId?.busNumber || trip.busId?.name || "—"}</td>
                        <td className="py-2">
                          <Badge variant={trip.status === "cancelled" ? "destructive" : trip.status === "completed" ? "secondary" : "success"}>{trip.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === "routes" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Route size={18} className="text-primary" /> Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {relatedLoading ? (
              <div className="flex h-20 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" /></div>
            ) : routes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No routes found for this station.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">From</th>
                      <th className="pb-2 pr-4 font-medium">To</th>
                      <th className="pb-2 pr-4 font-medium">Distance</th>
                      <th className="pb-2 pr-4 font-medium">Est. Time</th>
                      <th className="pb-2 pr-4 font-medium">Stations</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route) => (
                      <tr key={route._id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/routes/${route._id}`)}>
                        <td className="py-2 pr-4">{route.fromCity?.name || "—"}</td>
                        <td className="py-2 pr-4">{route.toCity?.name || "—"}</td>
                        <td className="py-2 pr-4">{route.distanceKm ? `${route.distanceKm} km` : "—"}</td>
                        <td className="py-2 pr-4">{route.estimatedTimeMinutes ? `${route.estimatedTimeMinutes} min` : "—"}</td>
                        <td className="py-2 pr-4">{(route.fromStations?.length || 0) + (route.toStations?.length || 0)}</td>
                        <td className="py-2">
                          <Badge variant={route.isActive !== false ? "success" : "secondary"}>{route.isActive !== false ? "Active" : "Inactive"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === "buses" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bus size={18} className="text-primary" /> Buses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {relatedLoading ? (
              <div className="flex h-20 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" /></div>
            ) : buses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No buses found for this station.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Bus Number</th>
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Capacity</th>
                      <th className="pb-2 pr-4 font-medium">Type</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buses.map((bus) => (
                      <tr key={bus._id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/fleet/${bus._id}`)}>
                        <td className="py-2 pr-4">{bus.busNumber || "—"}</td>
                        <td className="py-2 pr-4">{bus.name || "—"}</td>
                        <td className="py-2 pr-4">{bus.capacity || "—"}</td>
                        <td className="py-2 pr-4">{bus.type || "—"}</td>
                        <td className="py-2">
                          <Badge variant={bus.status === "active" ? "success" : bus.status === "maintenance" ? "warning" : "secondary"}>{bus.status || "—"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === "location" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned size={18} className="text-primary" /> {t("stations.coordinatesTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <div className="flex gap-2">
                  <div className="flex-1">{renderField("Lat", <input type="number" step="any" value={draft.lat ?? String(station.location.lat)} onChange={(e) => setDraft({ ...draft, lat: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />)}</div>
                  <div className="flex-1">{renderField("Lng", <input type="number" step="any" value={draft.lng ?? String(station.location.lng)} onChange={(e) => setDraft({ ...draft, lng: e.target.value })} className="w-full p-1.5 border rounded-md bg-muted/30 text-sm" />)}</div>
                </div>
              ) : (
                renderField(
                  t("stations.coordinates"),
                  `${station.location.lat.toFixed(6)}, ${station.location.lng.toFixed(6)}`,
                  <Globe size={14} />
                )
              )}
              <div ref={mapRef} className="h-64 w-full rounded-lg border z-0" />
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "status" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck size={18} className="text-primary" /> {t("stations.status")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {editing ? (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="editStatus" checked={(draft.isActive ?? String(station.isActive !== false)) === "true"} onChange={() => setDraft({ ...draft, isActive: "true" })} className="accent-primary" />
                      <span className="text-sm">{t("stations.active")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="editStatus" checked={(draft.isActive ?? String(station.isActive !== false)) === "false"} onChange={() => setDraft({ ...draft, isActive: "false" })} className="accent-destructive" />
                      <span className="text-sm">{t("stations.inactive")}</span>
                    </label>
                  </div>
                ) : (
                  renderField(
                    t("stations.status"),
                    <Badge variant={station.isActive !== false ? "success" : "secondary"}>
                      {station.isActive !== false ? t("stations.active") : t("stations.inactive")}
                    </Badge>,
                    <ShieldCheck size={14} />
                  )
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock size={18} className="text-primary" /> {t("stations.auditInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {renderField(t("stations.createdAt"), station.createdAt ? new Date(station.createdAt).toLocaleString() : "—", <CalendarClock size={14} />)}
                {renderField(t("stations.createdBy"), getUserName(station.createdBy), <UserIcon size={14} />)}
                {station.updatedAt && renderField(t("stations.updatedAt"), new Date(station.updatedAt).toLocaleString(), <Clock size={14} />)}
                {renderField(t("stations.stationId"), station._id, <Fingerprint size={14} />)}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
};

export default StationDetailsPage;
