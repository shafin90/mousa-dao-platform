import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useStations } from "../hooks/useStations";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { Plus, RefreshCw, MapPin, Eye, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { StationData } from "@/api/stationApi";
import { StationMapPicker } from "./StationMapPicker";
import { StationDetailModal } from "../components/StationDetailModal";

const StationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { stations, loading, create, remove, refresh } = useStations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<StationData | null>(null);
  const [form, setForm] = useState({ name: "", address: "", lat: "", lng: "", isActive: true });
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.lat || !form.lng) {
      toast.error(t("stations.validationRequired"));
      return;
    }
    try {
      await create({
        name: form.name,
        address: form.address || undefined,
        location: { lat: Number(form.lat), lng: Number(form.lng) },
        isActive: form.isActive,
      } as Partial<StationData>);
      toast.success(t("stations.created"));
      setIsModalOpen(false);
      setForm({ name: "", address: "", lat: "", lng: "", isActive: true });
    } catch {
      toast.error(t("stations.createFailed"));
    }
  };

  const geoTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!form.lat || !form.lng) return;
    if (geoTimeout.current) clearTimeout(geoTimeout.current);
    geoTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${form.lat}&lon=${form.lng}&format=jsonv2`,
          { headers: { "Accept-Language": "en", "User-Agent": "BusAdminApp/1.0" } }
        );
        const data = await res.json();
        if (data?.display_name) {
          setForm((prev) => ({ ...prev, address: data.display_name }));
        }
      } catch {}
    }, 800);
    return () => { if (geoTimeout.current) clearTimeout(geoTimeout.current); };
  }, [form.lat, form.lng]);

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

  const columns = [
    { header: t("stations.name"), accessor: (item: StationData) => item.name },
    { header: t("stations.address"), accessor: (item: StationData) => item.address || "—" },
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
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedStation(item); setDetailOpen(true); }}>
            <Eye size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            setForm({ name: item.name, address: item.address || "", lat: String(item.location.lat), lng: String(item.location.lng), isActive: item.isActive !== false });
            setIsModalOpen(true);
          }}>
            <MapPin size={14} className="mr-1" /> {t("common.edit")}
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("stations.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("stations.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}><RefreshCw size={16} /> {t("common.refresh")}</Button>
          <Button size="sm" className="gap-2" onClick={() => { setForm({ name: "", address: "", lat: "", lng: "", isActive: true }); setIsModalOpen(true); }}><Plus size={16} /> {t("stations.newStation")}</Button>
        </div>
      </div>
      <DataTable columns={columns} data={stations} isLoading={loading} />

      <StationDetailModal station={selectedStation} isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedStation(null); }} />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setStationToDelete(null); }} title={t("stations.deleteStation")}>
        {stationToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("stations.confirmDelete", { name: stationToDelete.name })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setStationToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={() => { remove(stationToDelete._id); toast.success(t("stations.deleted")); setIsDeleteOpen(false); setStationToDelete(null); }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("stations.createStation")} className="max-w-xl">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.stationNameRequired")}</label>
              <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("stations.namePlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.address")}</label>
              <div className="flex gap-2">
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="flex-1 p-2 border rounded-md bg-muted/30" placeholder={t("stations.addressPlaceholder")} />
                <Button type="button" variant="outline" size="sm" onClick={handleSearchAddress}><Search size={14} /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.latitude")}</label>
              <input required type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="w-full p-2 border rounded-md" placeholder={t("stations.latPlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stations.longitude")}</label>
              <input required type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="w-full p-2 border rounded-md" placeholder={t("stations.lngPlaceholder")} />
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("stations.pickOnMap")}</label>
            <StationMapPicker
              lat={form.lat ? Number(form.lat) : undefined}
              lng={form.lng ? Number(form.lng) : undefined}
              onPick={(lat, lng) => setForm({ ...form, lat: String(lat), lng: String(lng) })}
              onAddressFound={(address) => setForm((prev) => ({ ...prev, address }))}
            />
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
