import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Save,
  Edit3,
  X,
  Phone,
  Mail,
  MapPinned,
  User as UserIcon,
  ShieldCheck,
  Clock,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Select } from "@/shared/components/ui/Select";
import { Modal } from "@/shared/components/modals/Modal";
import { cityApi, type CityData } from "@/api/cityApi";
import { stationApi, type StationData } from "@/api/stationApi";
import { userApi } from "@/api/userApi";
import type { User } from "@/shared/types";

const COUNTRIES = [
  "Côte d'Ivoire", "Benin", "Burkina Faso", "Mali", "Togo",
  "Nigeria", "Ghana", "Guinee Conakry", "Senegal", "Niger",
] as const;

function getManagerId(m: string | { _id: string } | undefined): string {
  if (!m) return "";
  return typeof m === "string" ? m : m._id;
}

function getManagerName(m: string | { _id: string; profile: { firstName: string; lastName: string } } | undefined): string {
  if (!m) return "";
  if (typeof m === "string") return "";
  return `${m.profile.firstName} ${m.profile.lastName}`;
}

function getUserName(u: User): string {
  return `${u.profile.firstName} ${u.profile.lastName}`;
}

const CityDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [city, setCity] = useState<CityData | null>(null);
  const [stations, setStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [form, setForm] = useState<Partial<CityData>>({});
  const [confirmClose, setConfirmClose] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cityData, allUsers] = await Promise.all([
          cityApi.getById(id),
          userApi.getAll({ limit: 1000 }),
        ]);
        if (!active) return;
        if (!cityData) { setNotFound(true); return; }
        setCity(cityData);
        setForm({ ...cityData });
        setUsers(allUsers.users.filter((u) => u.role !== "customer"));
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = await stationApi.getAll();
        if (active) setStations(all.filter((s) => {
          const cid = typeof s.cityId === "string" ? s.cityId : s.cityId?._id;
          return cid === id;
        }));
      } catch {
        if (active) setStations([]);
      } finally {
        if (active) setStationsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!editing || !mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const lat = form.location?.lat ?? 6.8501;
    const lng = form.location?.lng ?? -5.2986;
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([lat, lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setForm((prev) => ({
        ...prev,
        location: { lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) },
      }));
    });
    markerRef.current = marker;
    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [editing]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await cityApi.update(id, form);
      setCity(updated);
      setForm({ ...updated });
      setEditing(false);
      toast.success(t("cities.updated"));
    } catch {
      toast.error(t("cities.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (JSON.stringify(form) !== JSON.stringify(city)) {
      setConfirmClose(true);
      return;
    }
    setForm({ ...city! });
    setEditing(false);
  };

  const confirmDiscard = () => {
    setForm({ ...city! });
    setEditing(false);
    setConfirmClose(false);
  };

  const setLocation = (lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      location: { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) },
    }));
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
    }
  };

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

  const renderInput = (
    label: string,
    value: string | undefined,
    onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; required?: boolean; disabled?: boolean; icon?: React.ReactNode } = {}
  ) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {opts.icon && <span className="shrink-0">{opts.icon}</span>}
        {label}{opts.required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={opts.type || "text"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts.placeholder}
        disabled={opts.disabled}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !city) {
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
    if (!city.createdBy) return "—";
    if (typeof city.createdBy === "string") return city.createdBy;
    return `${city.createdBy.profile.firstName} ${city.createdBy.profile.lastName}`;
  })();

  const managerOptions = users.map((u) => ({
    value: u._id,
    label: getUserName(u),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/cities")}>
            <ArrowLeft size={16} /> {t("cities.backToCities")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Building2 size={22} className="text-primary" />
            <span>{city.name}</span>
            {!editing && (
              <Badge variant={city.isActive !== false ? "success" : "secondary"}>
                {city.isActive !== false ? t("common.active") : t("common.inactive")}
              </Badge>
            )}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{city._id}</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCancel}>
                <X size={16} /> {t("common.cancel")}
              </Button>
              <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? t("common.saving") : t("common.save")}
              </Button>
            </>
          ) : (
            <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Edit3 size={16} /> {t("cities.editCity")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Globe size={16} /> {t("cities.country")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {editing ? (
              <Select
                value={form.country ?? ""}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                placeholder={t("cities.selectCountry")}
              />
            ) : (
              <p className="text-lg font-semibold">{city.country}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Phone size={16} /> {t("cities.phone1")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {editing ? (
              <input
                type="tel"
                value={form.phone1 ?? ""}
                onChange={(e) => setForm({ ...form, phone1: e.target.value })}
                placeholder={t("cities.phone1Placeholder")}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-lg font-semibold">{city.phone1 || "—"}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Mail size={16} /> {t("cities.email1")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {editing ? (
              <input
                type="email"
                value={form.email1 ?? ""}
                onChange={(e) => setForm({ ...form, email1: e.target.value })}
                placeholder={t("cities.email1Placeholder")}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-lg font-semibold">{city.email1 || "—"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin size={18} className="text-primary" /> {t("cities.addressInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  {renderInput(t("cities.cityName"), form.name ?? "", (v) => setForm({ ...form, name: v }), { required: true, icon: <Building2 size={14} /> })}
                  {renderInput(t("cities.address1"), form.address1 ?? "", (v) => setForm({ ...form, address1: v }), { icon: <MapPin size={14} /> })}
                  {renderInput(t("cities.address2"), form.address2 ?? "", (v) => setForm({ ...form, address2: v }), { icon: <MapPin size={14} /> })}
                </>
              ) : (
                <div className="space-y-1">
                  {renderField(t("cities.cityName"), city.name, <Building2 size={14} />)}
                  {renderField(t("cities.address1"), city.address1 || "—", <MapPin size={14} />)}
                  {renderField(t("cities.address2"), city.address2 || "—", <MapPin size={14} />)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone size={18} className="text-primary" /> {t("cities.contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  {renderInput(t("cities.phone1"), form.phone1 ?? "", (v) => setForm({ ...form, phone1: v }), { type: "tel", icon: <Phone size={14} /> })}
                  {renderInput(t("cities.phone2"), form.phone2 ?? "", (v) => setForm({ ...form, phone2: v }), { type: "tel", icon: <Phone size={14} /> })}
                  {renderInput(t("cities.email1"), form.email1 ?? "", (v) => setForm({ ...form, email1: v }), { type: "email", icon: <Mail size={14} /> })}
                  {renderInput(t("cities.email2"), form.email2 ?? "", (v) => setForm({ ...form, email2: v }), { type: "email", icon: <Mail size={14} /> })}
                </>
              ) : (
                <div className="space-y-1">
                  {renderField(t("cities.phone1"), city.phone1 || "—", <Phone size={14} />)}
                  {renderField(t("cities.phone2"), city.phone2 || "—", <Phone size={14} />)}
                  {renderField(t("cities.email1"), city.email1 || "—", <Mail size={14} />)}
                  {renderField(t("cities.email2"), city.email2 || "—", <Mail size={14} />)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon size={18} className="text-primary" /> {t("cities.management")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <UserIcon size={14} /> {t("cities.manager1")}
                    </label>
                    <Select
                      value={getManagerId(form.manager1)}
                      onChange={(e) => setForm({ ...form, manager1: e.target.value || undefined })}
                      options={managerOptions}
                      placeholder={t("cities.selectManager")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <UserIcon size={14} /> {t("cities.manager2")}
                    </label>
                    <Select
                      value={getManagerId(form.manager2)}
                      onChange={(e) => setForm({ ...form, manager2: e.target.value || undefined })}
                      options={managerOptions}
                      placeholder={t("cities.selectManager")}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  {renderField(t("cities.manager1"), getManagerName(city.manager1) || "—", <UserIcon size={14} />)}
                  {renderField(t("cities.manager2"), getManagerName(city.manager2) || "—", <UserIcon size={14} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned size={18} className="text-primary" /> {t("cities.coordinates")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {renderInput(
                      t("cities.latitude"),
                      form.location?.lat?.toString() ?? "",
                      (v) => setLocation(parseFloat(v) || 0, form.location?.lng ?? 0),
                      { type: "number", placeholder: "6.8501" }
                    )}
                    {renderInput(
                      t("cities.longitude"),
                      form.location?.lng?.toString() ?? "",
                      (v) => setLocation(form.location?.lat ?? 0, parseFloat(v) || 0),
                      { type: "number", placeholder: "-5.2986" }
                    )}
                  </div>
                  <div ref={mapRef} className="h-64 w-full rounded-lg border z-0" />
                </>
              ) : (
                <div className="space-y-1">
                  {renderField(
                    t("cities.coordinates"),
                    city.location?.lat != null
                      ? `${city.location.lat.toFixed(6)}, ${city.location.lng.toFixed(6)}`
                      : "—",
                    <MapPinned size={14} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck size={18} className="text-primary" /> {t("cities.statusSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <ShieldCheck size={14} /> {t("cities.status")}
                  </label>
                  <Select
                    value={form.isActive !== false ? "active" : "inactive"}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                    options={[
                      { value: "active", label: t("common.active") },
                      { value: "inactive", label: t("common.inactive") },
                    ]}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  {renderField(
                    t("cities.status"),
                    <Badge variant={city.isActive !== false ? "success" : "secondary"}>
                      {city.isActive !== false ? t("common.active") : t("common.inactive")}
                    </Badge>,
                    <ShieldCheck size={14} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock size={18} className="text-primary" /> {t("cities.auditInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("cities.createdAt"), city.createdAt ? new Date(city.createdAt).toLocaleString() : "—", <Clock size={14} />)}
              {renderField(t("cities.createdBy"), createdByDisplay, <UserIcon size={14} />)}
              {city.updatedAt && renderField(t("cities.updatedAt"), new Date(city.updatedAt).toLocaleString(), <Clock size={14} />)}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin size={18} className="text-primary" /> {t("cities.stationsInCity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={stationColumns} data={stations} isLoading={stationsLoading} onRowClick={(row) => navigate(`/stations/${row._id}`)} />
        </CardContent>
      </Card>

      <Modal isOpen={confirmClose} onClose={() => setConfirmClose(false)} title={t("cities.unsavedChanges")}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("cities.discardConfirm")}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmClose(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={confirmDiscard}>{t("common.discard")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CityDetailsPage;