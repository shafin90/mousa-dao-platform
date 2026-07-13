import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Building2, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { StationMapPicker } from "@/features/stations/pages/StationMapPicker";
import { cityApi, type CityData } from "@/api/cityApi";
import { stationApi, type StationData } from "@/api/stationApi";

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

interface CityRow extends CityData {
  station?: StationData;
}

const emptyForm = { cityName: "", stationName: "", address: "", lat: "", lng: "", isActive: true };

const CitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const [cities, setCities] = useState<CityData[]>([]);
  const [stations, setStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CityRow | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CityRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    setLoading(true);
    try {
      const [cityData, stationData] = await Promise.all([cityApi.getAll(), stationApi.getAll()]);
      setCities(cityData);
      setStations(stationData);
    } catch {
      toast.error(t("cities.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stationByCity = useMemo(() => {
    const map = new Map<string, StationData>();
    stations.forEach((s) => {
      const cid = idOf(s.cityId);
      if (cid) map.set(cid, s);
    });
    return map;
  }, [stations]);

  const rows = useMemo<CityRow[]>(
    () => cities.map((c) => ({ ...c, station: stationByCity.get(c._id) })),
    [cities, stationByCity]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (row: CityRow) => {
    setEditing(row);
    setForm({
      cityName: row.name,
      stationName: row.station?.name || "",
      address: row.station?.address || "",
      lat: row.station ? String(row.station.location.lat) : "",
      lng: row.station ? String(row.station.location.lng) : "",
      isActive: row.station ? row.station.isActive !== false : true,
    });
    setIsModalOpen(true);
  };

  const handleSearchAddress = async () => {
    if (!form.address) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address)}&format=jsonv2&limit=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "BusAdminApp/1.0" } }
      );
      const data = await res.json();
      if (data?.length > 0) {
        setForm((prev) => ({ ...prev, lat: data[0].lat, lng: data[0].lon }));
        toast.success(t("stations.locationFound"));
      } else {
        toast.error(t("stations.addressNotFound"));
      }
    } catch {
      toast.error(t("stations.searchFailed"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityName || !form.stationName || !form.lat || !form.lng) {
      toast.error(t("cities.validationRequired"));
      return;
    }
    setSaving(true);
    try {
      const location = { lat: Number(form.lat), lng: Number(form.lng) };
      if (editing) {
        if (editing.name !== form.cityName) {
          await cityApi.update(editing._id, { name: form.cityName });
        }
        const stationPayload = {
          name: form.stationName,
          address: form.address || undefined,
          cityId: editing._id,
          location,
          isActive: form.isActive,
        } as unknown as Partial<StationData>;
        if (editing.station) {
          await stationApi.update(editing.station._id, stationPayload);
        } else {
          await stationApi.create(stationPayload);
        }
        toast.success(t("cities.updated"));
      } else {
        const city = await cityApi.create({ name: form.cityName });
        const stationPayload = {
          name: form.stationName,
          address: form.address || undefined,
          cityId: city._id,
          location,
          isActive: form.isActive,
        } as unknown as Partial<StationData>;
        await stationApi.create(stationPayload);
        toast.success(t("cities.created"));
      }
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      await load();
    } catch {
      toast.error(t("cities.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      if (toDelete.station) await stationApi.delete(toDelete.station._id);
      await cityApi.delete(toDelete._id);
      toast.success(t("cities.deleted"));
      setIsDeleteOpen(false);
      setToDelete(null);
      await load();
    } catch {
      toast.error(t("cities.deleteFailed"));
    }
  };

  const columns = [
    { header: t("cities.cityName"), accessor: (row: CityRow) => <span className="font-medium">{row.name}</span> },
    { header: t("cities.station"), accessor: (row: CityRow) => row.station?.name || <span className="text-muted-foreground">{t("cities.noStation")}</span> },
    {
      header: t("stations.coordinates"),
      accessor: (row: CityRow) =>
        row.station
          ? t("stations.coordsFormat", { lat: row.station.location.lat.toFixed(4), lng: row.station.location.lng.toFixed(4) })
          : "—",
    },
    {
      header: t("common.status"),
      accessor: (row: CityRow) =>
        row.station ? (
          <Badge variant={row.station.isActive !== false ? "success" : "secondary"}>
            {row.station.isActive !== false ? t("stations.active") : t("stations.inactive")}
          </Badge>
        ) : (
          <Badge variant="warning">{t("cities.noStation")}</Badge>
        ),
    },
    {
      header: t("cities.actions"),
      accessor: (row: CityRow) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil size={14} className="mr-1" /> {t("common.edit")}
          </Button>
          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setToDelete(row); setIsDeleteOpen(true); }}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Building2 size={26} className="text-primary" /> {t("cities.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("cities.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={16} /> {t("cities.newCity")}
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={rows} isLoading={loading} />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setToDelete(null); }} title={t("cities.deleteCity")}>
        {toDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("cities.confirmDelete", { name: toDelete.name })}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? t("cities.editCity") : t("cities.createCity")}
        className="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("cities.cityNameRequired")}</label>
              <input
                required
                type="text"
                value={form.cityName}
                onChange={(e) => setForm({ ...form, cityName: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={t("cities.cityNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("cities.stationNameRequired")}</label>
              <input
                required
                type="text"
                value={form.stationName}
                onChange={(e) => setForm({ ...form, stationName: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={t("cities.stationNamePlaceholder")}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("stations.address")}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="flex-1 rounded-md border bg-muted/30 p-2"
                  placeholder={t("stations.addressPlaceholder")}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleSearchAddress}><Search size={14} /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.latitude")}</label>
              <input required type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="w-full rounded-md border p-2" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.longitude")}</label>
              <input required type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="w-full rounded-md border p-2" />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("stations.activeStatus")}</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                  <span className="text-sm">{t("stations.active")}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-destructive" />
                  <span className="text-sm">{t("stations.inactive")}</span>
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium"><MapPin size={14} /> {t("stations.pickOnMap")}</label>
            <StationMapPicker
              lat={form.lat ? Number(form.lat) : undefined}
              lng={form.lng ? Number(form.lng) : undefined}
              onPick={(lat, lng) => setForm((prev) => ({ ...prev, lat: String(lat), lng: String(lng) }))}
              onAddressFound={(address) => setForm((prev) => ({ ...prev, address }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("cities.saveCity")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CitiesPage;
