import React, { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { stationApi, type StationData } from "@/api/stationApi";

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
        <Badge variant={station.isActive !== false ? "success" : "secondary"} className="w-fit">
          {station.isActive !== false ? t("stations.active") : t("stations.inactive")}
        </Badge>
      </div>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Home size={18} className="text-primary" /> {t("stations.addressInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("stations.address1"), station.address1 || "—", <MapPin size={14} />)}
              {renderField(t("stations.address2"), station.address2 || "—", <MapPin size={14} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone size={18} className="text-primary" /> {t("stations.contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("stations.phone1"), station.phone1 || "—", <Phone size={14} />)}
              {renderField(t("stations.phone2"), station.phone2 || "—", <Phone size={14} />)}
              {renderField(t("stations.email1"), station.email1 || "—", <Mail size={14} />)}
              {renderField(t("stations.email2"), station.email2 || "—", <Mail size={14} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon size={18} className="text-primary" /> {t("stations.management")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("stations.manager1"), getManagerName(station.manager1) || "—", <UserIcon size={14} />)}
              {renderField(t("stations.manager2"), getManagerName(station.manager2) || "—", <UserIcon size={14} />)}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned size={18} className="text-primary" /> {t("stations.coordinatesTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderField(
                t("stations.coordinates"),
                `${station.location.lat.toFixed(6)}, ${station.location.lng.toFixed(6)}`,
                <Globe size={14} />
              )}
              <div ref={mapRef} className="h-64 w-full rounded-lg border z-0" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck size={18} className="text-primary" /> {t("stations.status")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(
                t("stations.status"),
                <Badge variant={station.isActive !== false ? "success" : "secondary"}>
                  {station.isActive !== false ? t("stations.active") : t("stations.inactive")}
                </Badge>,
                <ShieldCheck size={14} />
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
    </div>
  );
};

export default StationDetailsPage;
