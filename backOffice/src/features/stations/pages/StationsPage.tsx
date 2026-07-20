import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStations } from "../hooks/useStations";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { Plus, RefreshCw, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { StationData } from "@/api/stationApi";
import { cityApi, type CityData } from "@/api/cityApi";
import { userApi } from "@/api/userApi";
import type { User } from "@/shared/types";
import { StationMapPicker } from "./StationMapPicker";

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

function getUserName(u: User): string {
  return `${u.profile.firstName} ${u.profile.lastName}`;
}

const EMPTY_FORM = { name: "", cityId: "", address1: "", address2: "", phone1: "", phone2: "", email1: "", email2: "", lat: "", lng: "", isActive: true, manager1: "", manager2: "" };

interface Bounds {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
}

const StationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stations, loading, create, remove, refresh } = useStations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<StationData | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [cities, setCities] = useState<CityData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cityBounds, setCityBounds] = useState<Bounds | null>(null);
  const [cityName, setCityName] = useState("");

  useEffect(() => {
    cityApi.getAll().then(setCities).catch(() => setCities([]));
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

  const isOutsideBounds = (lat: number, lng: number) => {
    if (!cityBounds) return false;
    return lat < cityBounds.minLat || lat > cityBounds.maxLat ||
           lng < cityBounds.minLng || lng > cityBounds.maxLng;
  };

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.lat || !form.lng) {
      toast.error(t("stations.validationRequired"));
      return;
    }
    if (!form.cityId) {
      toast.error(t("stations.validationCityRequired"));
      return;
    }
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (isOutsideBounds(lat, lng)) {
      toast.error(t("stations.outsideCity"));
      return;
    }
    try {
      await create({
        name: form.name,
        cityId: form.cityId,
        address1: form.address1 || undefined,
        address2: form.address2 || undefined,
        phone1: form.phone1 || undefined,
        phone2: form.phone2 || undefined,
        email1: form.email1 || undefined,
        email2: form.email2 || undefined,
        location: { lat, lng },
        isActive: form.isActive,
        manager1: form.manager1 || undefined,
        manager2: form.manager2 || undefined,
      } as unknown as Partial<StationData>);
      toast.success(t("stations.created"));
      setIsModalOpen(false);
      setForm({ ...EMPTY_FORM });
      setCityBounds(null);
      setCityName("");
    } catch {
      toast.error(t("stations.createFailed"));
    }
  };

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
        if (isOutsideBounds(lat, lng)) {
          toast.error(t("stations.outsideCity"));
          return;
        }
        setForm((prev) => ({ ...prev, lat: String(lat), lng: String(lng), address1: data[0].display_name || prev.address1 }));
        toast.success(t("stations.locationFound"));
      } else {
        toast.error(t("stations.addressNotFound"));
      }
    } catch {
      toast.error(t("stations.searchFailed"));
    }
  };

  const columns = [
    { header: t("stations.name"), accessor: (item: StationData) => item.name },
    { header: t("stations.city"), accessor: (item: StationData) => {
      const cityId = idOf(item.cityId);
      return cities.find((c) => c._id === cityId)?.name || "—";
    } },
    { header: t("stations.address1"), accessor: (item: StationData) => item.address1 || item.address || "—" },
    { header: t("stations.coordinates"), accessor: (item: StationData) => t("stations.coordsFormat", { lat: item.location.lat.toFixed(4), lng: item.location.lng.toFixed(4) }) },
    {
      header: t("stations.status"),
      accessor: (item: StationData) => (
        <Badge variant={item.isActive !== false ? "success" : "secondary"}>
          {item.isActive !== false ? t("stations.active") : t("stations.inactive")}
        </Badge>
      ),
    },
    {
      header: t("stations.actions"),
      accessor: (item: StationData) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            setForm({ name: item.name, cityId: idOf(item.cityId), address1: item.address1 || item.address || "", address2: item.address2 || "", phone1: item.phone1 || "", phone2: item.phone2 || "", email1: item.email1 || "", email2: item.email2 || "", lat: String(item.location.lat), lng: String(item.location.lng), isActive: item.isActive !== false, manager1: idOf(item.manager1), manager2: idOf(item.manager2) });
            setIsModalOpen(true);
          }}>
            <Pencil size={14} />
          </Button>
          <Button variant="destructive" size="sm" onClick={(e) => {
            e.stopPropagation();
            setStationToDelete(item);
            setIsDeleteOpen(true);
          }}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("stations.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("stations.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button data-tour="stations-refresh" variant="outline" onClick={refresh} disabled={loading}><RefreshCw size={16} /></Button>
          <Button data-tour="stations-add" onClick={() => { setForm({ ...EMPTY_FORM }); setIsModalOpen(true); }} disabled={cities.length === 0}><Plus size={16} /> {t("stations.newStation")}</Button>
        </div>
      </div>

      <div data-tour="stations-table"><DataTable columns={columns} data={stations} isLoading={loading} onRowClick={(item) => navigate(`/stations/${item._id}`)} /></div>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setStationToDelete(null); }} title={t("stations.deleteStation")}>
        {stationToDelete && (
          <div className="space-y-4">
            <p>{t("stations.confirmDelete", { name: stationToDelete.name })}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setStationToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={() => { remove(stationToDelete._id); toast.success(t("stations.deleted")); setIsDeleteOpen(false); setStationToDelete(null); }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCityBounds(null); setCityName(""); }} title={t("stations.createStation")} className="max-w-2xl">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("stations.cityRequired")}</label>
            <select required value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} className="w-full p-2 border rounded-md bg-background">
              <option value="">{t("stations.selectCity")}</option>
              {cities.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.country})</option>
              ))}
            </select>
            {cities.length === 0 && (
              <p className="text-xs text-amber-600">{t("stations.noCities")}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("stations.stationNameRequired")}</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("stations.namePlaceholder")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.address1")}</label>
              <div className="flex gap-2">
                <input type="text" value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} className="flex-1 p-2 border rounded-md bg-muted/30" placeholder={t("stations.addressPlaceholder")} />
                <Button type="button" variant="outline" size="sm" onClick={handleSearchAddress} disabled={!cityName}><Search size={14} /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.address2")}</label>
              <input type="text" value={form.address2} onChange={(e) => setForm({ ...form, address2: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.phone1")}</label>
              <input type="tel" value={form.phone1} onChange={(e) => setForm({ ...form, phone1: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.phone2")}</label>
              <input type="tel" value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.email1")}</label>
              <input type="email" value={form.email1} onChange={(e) => setForm({ ...form, email1: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.email2")}</label>
              <input type="email" value={form.email2} onChange={(e) => setForm({ ...form, email2: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.manager1")}</label>
              <select value={form.manager1} onChange={(e) => setForm({ ...form, manager1: e.target.value })} className="w-full p-2 border rounded-md bg-background">
                <option value="">{t("cities.selectManager")}</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{getUserName(u)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.manager2")}</label>
              <select value={form.manager2} onChange={(e) => setForm({ ...form, manager2: e.target.value })} className="w-full p-2 border rounded-md bg-background">
                <option value="">{t("cities.selectManager")}</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{getUserName(u)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.latitude")}</label>
              <input required type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("stations.latPlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.longitude")}</label>
              <input required type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("stations.lngPlaceholder")} />
            </div>
          </div>

          <div className="space-y-2">
            <StationMapPicker
              lat={form.lat ? Number(form.lat) : undefined}
              lng={form.lng ? Number(form.lng) : undefined}
              onPick={handleMapPick}
              onAddressFound={(address) => setForm((prev) => ({ ...prev, address1: address }))}
              cityBounds={cityBounds}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("stations.activeStatus")}</label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                <span className="text-sm">{t("stations.active")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-destructive" />
                <span className="text-sm">{t("stations.inactive")}</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit">{t("stations.saveStation")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default StationsPage;
