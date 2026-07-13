import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useRoutes } from "../hooks/useRoutes";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Modal } from "@/shared/components/modals/Modal";
import { toast } from "sonner";
import { stationApi, type StationData } from "@/api/stationApi";
import { normalizeStops, type RouteData, type RouteStopInput } from "@/api/routeApi";
import { cityApi, type CityData } from "@/api/cityApi";
import { RouteMap } from "@/shared/components/maps/RouteMap";
import { RouteStopsEditor } from "../components/RouteStopsEditor";

interface RouteForm {
  fromStation: string;
  toStation: string;
  baseFare: string;
  distanceKm: string;
  estimatedTimeMinutes: string;
  stops: RouteStopInput[];
}

const emptyForm: RouteForm = { fromStation: "", toStation: "", baseFare: "", distanceKm: "", estimatedTimeMinutes: "", stops: [] };

const RoutesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { routes, loading, create, update, remove, refresh } = useRoutes();
  const [stations, setStations] = useState<StationData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<RouteData | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [form, setForm] = useState<RouteForm>(emptyForm);
  const calcTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const openEdit = (item: RouteData) => {
    setEditingRouteId(item._id);
    setForm({
      fromStation: typeof item.fromStation === "string" ? item.fromStation : item.fromStation?._id || "",
      toStation: typeof item.toStation === "string" ? item.toStation : item.toStation?._id || "",
      baseFare: String(item.baseFare || ""),
      distanceKm: String(item.distanceKm || ""),
      estimatedTimeMinutes: item.estimatedTimeMinutes != null ? String(item.estimatedTimeMinutes) : "",
      stops: normalizeStops(item.stops),
    });
    setIsModalOpen(true);
  };

  const fetchStations = async () => {
    setStationsLoading(true);
    try {
      const [stationData, cityData] = await Promise.all([
        stationApi.getAll(),
        cityApi.getAll().catch(() => [] as CityData[]),
      ]);
      setStations(stationData);
      setCities(cityData);
    } catch {
      toast.error(t("routes.stationsLoadFailed"));
    } finally {
      setStationsLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && stations.length === 0) fetchStations();
  }, [isModalOpen]);

  useEffect(() => {
    const editId = (location.state as { editRouteId?: string } | null)?.editRouteId;
    if (editId && routes.length > 0) {
      const target = routes.find((r) => r._id === editId);
      if (target) openEdit(target);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, routes]);

  useEffect(() => {
    if (calcTimeout.current) clearTimeout(calcTimeout.current);
    if (form.fromStation && form.toStation && form.fromStation !== form.toStation) {
      calcTimeout.current = setTimeout(async () => {
        setCalcLoading(true);
        try {
          const result = await stationApi.getDistance(form.fromStation, form.toStation);
          setForm((prev) => ({
            ...prev,
            distanceKm: String(result.distanceKm),
            estimatedTimeMinutes: prev.estimatedTimeMinutes || (result.estimatedTimeMinutes != null ? String(Math.round(result.estimatedTimeMinutes)) : ""),
          }));
        } catch {
          // silently fail — user can still enter manually
        } finally {
          setCalcLoading(false);
        }
      }, 400);
    }
    return () => { if (calcTimeout.current) clearTimeout(calcTimeout.current); };
  }, [form.fromStation, form.toStation]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fromStation === form.toStation) {
      toast.error(t("routes.stationsMustDiff"));
      return;
    }
    try {
      const payload = { fromStation: form.fromStation as unknown as RouteData["fromStation"], toStation: form.toStation as unknown as RouteData["toStation"], baseFare: Number(form.baseFare), distanceKm: Number(form.distanceKm) } as Partial<RouteData>;
      if (form.estimatedTimeMinutes) payload.estimatedTimeMinutes = Number(form.estimatedTimeMinutes);
      payload.stops = form.stops.filter((s) => s.cityId);
      if (editingRouteId) {
        await update(editingRouteId, payload);
        toast.success(t("routes.updated"));
      } else {
        await create(payload);
        toast.success(t("routes.created"));
      }
      setIsModalOpen(false);
      setEditingRouteId(null);
      setForm(emptyForm);
    } catch {
      toast.error(t("routes.saveFailed"));
    }
  };

  const stationOptions = stations.map((s) => ({
    value: s._id,
    label: `${s.name} (${s.cityId?.name || "?"})`,
  }));

  const fromStation = stations.find((s) => s._id === form.fromStation);
  const toStation = stations.find((s) => s._id === form.toStation);

  const columns = [
    { header: t("routes.from"), accessor: (item: RouteData) => item.fromStation?.name || item.fromStation?._id || t("common.na") },
    { header: t("routes.to"), accessor: (item: RouteData) => item.toStation?.name || item.toStation?._id || t("common.na") },
    { header: t("routes.distance"), accessor: (item: RouteData) => item.distanceKm || t("common.na") },
    { header: t("routes.baseFare"), accessor: (item: RouteData) => <span className="font-medium">CFA {item.baseFare?.toFixed(2) || '0.00'}</span> },
    {
      header: t("routes.actions"),
      accessor: (item: RouteData) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/routes/${item._id}`); }}>
            <Eye size={14} className="mr-1" /> {t("routes.viewDetails")}
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            openEdit(item);
          }}>
            <Pencil size={14} />
          </Button>
          <Button variant="destructive" size="sm" onClick={(e) => {
            e.stopPropagation();
            setRouteToDelete(item);
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
          <h1 className="text-3xl font-bold tracking-tight">{t("routes.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("routes.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}><RefreshCw size={16} /> {t("common.refresh")}</Button>
          <Button size="sm" className="gap-2" onClick={() => { setEditingRouteId(null); setForm(emptyForm); setIsModalOpen(true); }}><Plus size={16} /> {t("routes.newRoute")}</Button>
        </div>
      </div>
      <DataTable columns={columns} data={routes} isLoading={loading} onRowClick={(item) => navigate(`/routes/${item._id}`)} />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setRouteToDelete(null); }} title={t("routes.deleteRoute")}>
        {routeToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("routes.confirmDelete", { from: routeToDelete.fromStation?.name || t("common.na"), to: routeToDelete.toStation?.name || t("common.na") })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setRouteToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={() => { remove(routeToDelete._id); toast.success(t("routes.deleted")); setIsDeleteOpen(false); setRouteToDelete(null); }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRouteId(null); }} title={editingRouteId ? t("routes.editRoute") : t("routes.createNewRoute")}>
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.fromStation")}</label>
              <Select
                required
                value={form.fromStation}
                onChange={(e) => setForm({ ...form, fromStation: e.target.value })}
                options={stationOptions}
                placeholder={stationsLoading ? t("routes.loadingStations") : t("routes.selectFromStation")}
                disabled={stationsLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.toStation")}</label>
              <Select
                required
                value={form.toStation}
                onChange={(e) => setForm({ ...form, toStation: e.target.value })}
                options={stationOptions}
                placeholder={stationsLoading ? t("routes.loadingStations") : t("routes.selectToStation")}
                disabled={stationsLoading}
              />
            </div>
          </div>
          {calcLoading && (
            <p className="text-xs text-muted-foreground text-center">{t("routes.calculatingDistance")}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.distanceKm")}</label>
              <input required type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.baseFare")} (CFA)</label>
              <input required type="number" value={form.baseFare} onChange={(e) => setForm({ ...form, baseFare: e.target.value })} className="w-full p-2 border rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("routes.estTimeMinutes")}</label>
            <input type="number" min="0" value={form.estimatedTimeMinutes} onChange={(e) => setForm({ ...form, estimatedTimeMinutes: e.target.value })} className="w-full p-2 border rounded-md" placeholder={t("routes.estTimePlaceholder")} />
          </div>
          {fromStation && toStation && fromStation._id !== toStation._id && (
            <RouteMap
              from={{ lat: fromStation.location.lat, lng: fromStation.location.lng }}
              to={{ lat: toStation.location.lat, lng: toStation.location.lng }}
              fromLabel={fromStation.name}
              toLabel={toStation.name}
            />
          )}
          <RouteStopsEditor
            value={form.stops}
            cities={cities}
            onChange={(stops) => setForm((prev) => ({ ...prev, stops }))}
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit">{editingRouteId ? t("common.update") : t("common.create")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default RoutesPage;
