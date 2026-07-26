import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Save,
  X,
  Phone,
  Mail,
  User as UserIcon,
  MapPinned,
  ShieldCheck,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { stationApi } from "@/api/stationApi";
import { cityApi, type CityData } from "@/api/cityApi";
import { userApi } from "@/api/userApi";
import type { User } from "@/shared/types";
import { StationMapPicker } from "./StationMapPicker";

const EMPTY_FORM = { name: "", cityId: "", address1: "", address2: "", phone1: "", phone2: "", email1: "", email2: "", lat: "", lng: "", isActive: true, manager1: "", manager2: "" };

interface Bounds {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
}

function getUserName(u: User): string {
  return `${u.profile.firstName} ${u.profile.lastName}`;
}

const StationCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useErrorModal();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [cities, setCities] = useState<CityData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cityBounds, setCityBounds] = useState<Bounds | null>(null);
  const [cityName, setCityName] = useState("");

  useEffect(() => {
    cityApi.getAll().then((res) => setCities(res.data)).catch(() => setCities([]));
    userApi.getAll({ limit: 1000 }).then((res) => setUsers(res.users.filter((u) => u.role !== "customer"))).catch(() => setUsers([]));
  }, []);

  const selectedCity = useCallback((cityId: string) => {
    return cities.find((c) => c._id === cityId) || null;
  }, [cities]);

  useEffect(() => {
    if (!form.cityId) {
      setCityBounds(null);
      setCityName("");
      return;
    }
    const city = selectedCity(form.cityId);
    if (!city) { setCityBounds(null); setCityName(""); return; }
    setCityName(city.name);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city.name + ", " + city.country)}&format=jsonv2&limit=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "BusAdminApp/1.0" } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.[0]?.boundingbox) {
          const [minLat, maxLat, minLng, maxLng] = data[0].boundingbox.map(Number);
          setCityBounds({ minLat, maxLat, minLng, maxLng });
        } else {
          setCityBounds(null);
        }
      })
      .catch(() => setCityBounds(null));
  }, [form.cityId, selectedCity]);

  const geoDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`,
        { headers: { "Accept-Language": "en", "User-Agent": "BusAdminApp/1.0" } }
      );
      const data = await res.json();
      const address = data?.display_name || data?.address?.road || data?.name || "";
      if (address) {
        setForm((prev) => ({ ...prev, address1: address }));
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!form.lat || !form.lng) return;
    if (geoDebounce.current) clearTimeout(geoDebounce.current);
    geoDebounce.current = setTimeout(() => {
      reverseGeocode(Number(form.lat), Number(form.lng));
    }, 600);
    return () => { if (geoDebounce.current) clearTimeout(geoDebounce.current); };
  }, [form.lat, form.lng, reverseGeocode]);

  const handleMapPick = useCallback((lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, lat: String(lat), lng: String(lng) }));
  }, []);

  const handleSearchAddress = async () => {
    const addr = form.address1;
    if (!addr) return;
    const city = selectedCity(form.cityId);
    const countryPart = city ? city.country : "";
    const query = cityName ? `${addr}, ${cityName}${countryPart ? `, ${countryPart}` : ""}` : addr;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "BusAdminApp/1.0" } }
      );
      const data = await res.json();
      if (data?.length > 0) {
        const lat = Number(data[0].lat);
        const lng = Number(data[0].lon);
        setForm((prev) => ({ ...prev, lat: String(lat), lng: String(lng), address1: data[0].display_name || prev.address1 }));
        toast.success(t("stations.locationFound"));
      } else {
        showError(t("stations.addressNotFound"));
      }
    } catch {
      showError(t("stations.searchFailed"));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      showError(t("stations.validationRequired"));
      return;
    }
    if (!form.cityId) {
      showError(t("stations.validationCityRequired"));
      return;
    }
    setSaving(true);
    try {
      const created = await stationApi.create({
        name: form.name,
        cityId: form.cityId as any,
        address1: form.address1 || undefined,
        address2: form.address2 || undefined,
        phone1: form.phone1 || undefined,
        phone2: form.phone2 || undefined,
        email1: form.email1 || undefined,
        email2: form.email2 || undefined,
        location: { lat: Number(form.lat), lng: Number(form.lng) },
        isActive: form.isActive,
        manager1: form.manager1 || undefined,
        manager2: form.manager2 || undefined,
      });
      toast.success(t("stations.created"));
      navigate(`/stations/${created._id}`);
    } catch {
      showError(t("stations.createFailed"));
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; required?: boolean; icon?: React.ReactNode } = {}
  ) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {opts.icon && <span className="shrink-0">{opts.icon}</span>}
        {label}{opts.required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={opts.type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts.placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/stations")}>
            <ArrowLeft size={16} /> {t("stations.backToStations")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Building2 size={22} className="text-primary" />
            {t("stations.createStation")}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={18} className="text-primary" /> {t("stations.stationName")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cities.length === 0 && (
                  <p className="text-xs text-amber-600">{t("stations.noCities")}</p>
                )}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Globe size={14} /> {t("stations.cityRequired")}
                  </label>
                  <select required value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">{t("stations.selectCity")}</option>
                    {cities.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.country})</option>
                    ))}
                  </select>
                </div>
                {renderInput(t("stations.stationNameRequired"), form.name, (v) => setForm({ ...form, name: v }), { required: true, icon: <Building2 size={14} />, placeholder: t("stations.namePlaceholder") })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={18} className="text-primary" /> {t("stations.address")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    {renderInput(t("stations.address1"), form.address1, (v) => setForm({ ...form, address1: v }), { icon: <MapPin size={14} />, placeholder: t("stations.addressPlaceholder") })}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-6" onClick={handleSearchAddress} disabled={!cityName}>
                    <Search size={14} />
                  </Button>
                </div>
                {renderInput(t("stations.address2"), form.address2, (v) => setForm({ ...form, address2: v }), { icon: <MapPin size={14} /> })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone size={18} className="text-primary" /> {t("stations.contactInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {renderInput(t("stations.phone1"), form.phone1, (v) => setForm({ ...form, phone1: v }), { type: "tel", icon: <Phone size={14} /> })}
                  {renderInput(t("stations.phone2"), form.phone2, (v) => setForm({ ...form, phone2: v }), { type: "tel", icon: <Phone size={14} /> })}
                  {renderInput(t("stations.email1"), form.email1, (v) => setForm({ ...form, email1: v }), { type: "email", icon: <Mail size={14} /> })}
                  {renderInput(t("stations.email2"), form.email2, (v) => setForm({ ...form, email2: v }), { type: "email", icon: <Mail size={14} /> })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserIcon size={18} className="text-primary" /> {t("stations.management")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <UserIcon size={14} /> {t("stations.manager1")}
                    </label>
                    <select value={form.manager1} onChange={(e) => setForm({ ...form, manager1: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">{t("cities.selectManager")}</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>{getUserName(u)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <UserIcon size={14} /> {t("stations.manager2")}
                    </label>
                    <select value={form.manager2} onChange={(e) => setForm({ ...form, manager2: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">{t("cities.selectManager")}</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>{getUserName(u)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPinned size={18} className="text-primary" /> {t("stations.coordinates")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {renderInput(t("stations.latitude"), form.lat, (v) => setForm({ ...form, lat: v }), { type: "number", placeholder: t("stations.latPlaceholder"), icon: <MapPinned size={14} /> })}
                  {renderInput(t("stations.longitude"), form.lng, (v) => setForm({ ...form, lng: v }), { type: "number", placeholder: t("stations.lngPlaceholder"), icon: <MapPinned size={14} /> })}
                </div>
                <StationMapPicker
                  lat={form.lat ? Number(form.lat) : undefined}
                  lng={form.lng ? Number(form.lng) : undefined}
                  onPick={handleMapPick}
                  onAddressFound={(address) => setForm((prev) => ({ ...prev, address1: address }))}
                  cityBounds={cityBounds}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck size={18} className="text-primary" /> {t("stations.activeStatus")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                    <span className="text-sm font-medium">{t("stations.active")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-destructive" />
                    <span className="text-sm font-medium">{t("stations.inactive")}</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("/stations")}>
            <X size={16} /> {t("common.cancel")}
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save size={16} /> {saving ? t("common.saving") : t("stations.saveStation")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StationCreatePage;
