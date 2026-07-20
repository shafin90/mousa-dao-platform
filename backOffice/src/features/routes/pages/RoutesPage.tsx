import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useRoutes } from "../hooks/useRoutes";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { Badge } from "@/shared/components/ui/Badge";
import { Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Modal } from "@/shared/components/modals/Modal";
import { toast } from "sonner";
import { normalizeStops, type RouteData, type RouteStopInput } from "@/api/routeApi";
import { cityApi, type CityData } from "@/api/cityApi";
import { stationApi, type StationData } from "@/api/stationApi";
import { RouteStopsEditor } from "../components/RouteStopsEditor";

interface RouteForm {
  fromCity: string;
  toCity: string;
  fromStations: string[];
  toStations: string[];
  distanceKm: string;
  estimatedTimeMinutes: string;
  baseRate: string;
  isActive: boolean;
  stops: RouteStopInput[];
}

const emptyForm: RouteForm = { fromCity: "", toCity: "", fromStations: [], toStations: [], distanceKm: "", estimatedTimeMinutes: "", baseRate: "", isActive: true, stops: [] };

const RoutesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { routes, loading, create, update, remove, refresh } = useRoutes();
  const [cities, setCities] = useState<CityData[]>([]);
  const [stations, setStations] = useState<StationData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<RouteData | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [form, setForm] = useState<RouteForm>(emptyForm);
  const [calcLoading, setCalcLoading] = useState(false);
  const calcTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (calcTimeout.current) clearTimeout(calcTimeout.current);
    if (!form.fromCity || !form.toCity || form.fromCity === form.toCity) return;
    calcTimeout.current = setTimeout(async () => {
      setCalcLoading(true);
      try {
        const result = await cityApi.getDistance(form.fromCity, form.toCity);
        setForm((prev) => ({ ...prev, distanceKm: String(result.distanceKm), estimatedTimeMinutes: String(result.estimatedTimeMinutes) }));
      } catch {
        toast.error(t("routes.distanceCalcFailed"));
      } finally {
        setCalcLoading(false);
      }
    }, 600);
    return () => { if (calcTimeout.current) clearTimeout(calcTimeout.current); };
  }, [form.fromCity, form.toCity]);

  const idOf = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
      return String((value as { _id: unknown })._id);
    }
    return "";
  };

  const openEdit = (item: RouteData) => {
    setEditingRouteId(item._id);
    setForm({
      fromCity: idOf(item.fromCity),
      toCity: idOf(item.toCity),
      fromStations: (item.fromStations || []).map((s) => idOf(s)),
      toStations: (item.toStations || []).map((s) => idOf(s)),
      distanceKm: String(item.distanceKm || ""),
      estimatedTimeMinutes: String(item.estimatedTimeMinutes || ""),
      baseRate: item.baseRate != null ? String(item.baseRate) : "",
      isActive: item.isActive !== false,
      stops: normalizeStops(item.stops),
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    cityApi.getAll().then(setCities).catch(() => setCities([]));
    stationApi.getAll().then(setStations).catch(() => setStations([]));
  }, []);

  useEffect(() => {
    if (isModalOpen && cities.length === 0) cityApi.getAll().then(setCities).catch(() => setCities([]));
    if (isModalOpen && stations.length === 0) stationApi.getAll().then(setStations).catch(() => setStations([]));
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fromCity === form.toCity) {
      toast.error(t("routes.stationsMustDiff"));
      return;
    }
    try {
      const payload = {
        fromCity: form.fromCity,
        toCity: form.toCity,
        fromStations: form.fromStations.filter(Boolean),
        toStations: form.toStations.filter(Boolean),
        distanceKm: Number(form.distanceKm),
        estimatedTimeMinutes: Number(form.estimatedTimeMinutes) || undefined,
        baseRate: form.baseRate ? Number(form.baseRate) : undefined,
        isActive: form.isActive,
        stops: form.stops.filter((s) => s.cityId),
      } satisfies Partial<RouteData>;
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

  const cityOptions = cities.map((c) => ({
    value: c._id,
    label: `${c.name} (${c.country})`,
  }));

  const getStationOptions = (cityId: string) =>
    stations.filter((s) => idOf(s.cityId) === cityId).map((s) => ({ value: s._id, label: s.name }));

  const columns = [
    { header: t("routes.from"), accessor: (item: RouteData) => item.fromCity?.name || item.fromCity?._id || t("common.na") },
    { header: t("routes.to"), accessor: (item: RouteData) => item.toCity?.name || item.toCity?._id || t("common.na") },
    { header: t("routes.distance"), accessor: (item: RouteData) => `${item.distanceKm} km` },
    {
      header: t("common.status"),
      accessor: (item: RouteData) => (
        <Badge variant={item.isActive !== false ? "success" : "secondary"}>
          {item.isActive !== false ? t("routes.active") : t("routes.inactive")}
        </Badge>
      ),
    },
    {
      header: t("routes.actions"),
      accessor: (item: RouteData) => (
        <div className="flex gap-1">
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
          <Button data-tour="routes-refresh" variant="outline" size="sm" className="gap-2" onClick={refresh}><RefreshCw size={16} /> {t("common.refresh")}</Button>
          <Button data-tour="routes-add" size="sm" className="gap-2" onClick={() => { setEditingRouteId(null); setForm(emptyForm); setIsModalOpen(true); }}><Plus size={16} /> {t("routes.newRoute")}</Button>
        </div>
      </div>
      <div data-tour="routes-table"><DataTable columns={columns} data={routes} isLoading={loading} onRowClick={(item) => navigate(`/routes/${item._id}`)} /></div>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setRouteToDelete(null); }} title={t("routes.deleteRoute")}>
        {routeToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("routes.confirmDelete", { from: routeToDelete.fromCity?.name || t("common.na"), to: routeToDelete.toCity?.name || t("common.na") })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setRouteToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={() => { remove(routeToDelete._id); toast.success(t("routes.deleted")); setIsDeleteOpen(false); setRouteToDelete(null); }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRouteId(null); }} title={editingRouteId ? t("routes.editRoute") : t("routes.createNewRoute")} className="max-w-3xl">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.departureCity")}</label>
              <Select
                required
                value={form.fromCity}
                onChange={(e) => setForm({ ...form, fromCity: e.target.value })}
                options={cityOptions}
                placeholder={t("routes.selectFromStation")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.destinationCity")}</label>
              <Select
                required
                value={form.toCity}
                onChange={(e) => setForm({ ...form, toCity: e.target.value })}
                options={cityOptions}
                placeholder={t("routes.selectToStation")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.fromStations")}</label>
              {form.fromCity ? (
                <div className="space-y-1">
                  {form.fromStations.map((sid, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Select
                        value={sid}
                        onChange={(e) => {
                          const updated = [...form.fromStations];
                          updated[i] = e.target.value;
                          setForm({ ...form, fromStations: updated });
                        }}
                        options={getStationOptions(form.fromCity)}
                        placeholder={t("routes.selectStation")}
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, fromStations: form.fromStations.filter((_, j) => j !== i) })}>
                        <X size={14} className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setForm({ ...form, fromStations: [...form.fromStations, ""] })}>
                    <Plus size={14} /> {t("routes.addFromStation")}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("routes.selectFromStation")}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.toStations")}</label>
              {form.toCity ? (
                <div className="space-y-1">
                  {form.toStations.map((sid, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Select
                        value={sid}
                        onChange={(e) => {
                          const updated = [...form.toStations];
                          updated[i] = e.target.value;
                          setForm({ ...form, toStations: updated });
                        }}
                        options={getStationOptions(form.toCity)}
                        placeholder={t("routes.selectStation")}
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, toStations: form.toStations.filter((_, j) => j !== i) })}>
                        <X size={14} className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setForm({ ...form, toStations: [...form.toStations, ""] })}>
                    <Plus size={14} /> {t("routes.addToStation")}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("routes.selectToStation")}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.distanceKm")}</label>
              <div className="relative">
                <input required type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} placeholder={t("routes.distancePlaceholder")} className="w-full p-2 border rounded-md" />
                {calcLoading && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.estTimeMinutes")}</label>
              <input type="number" value={form.estimatedTimeMinutes} onChange={(e) => setForm({ ...form, estimatedTimeMinutes: e.target.value })} placeholder={t("routes.estTimePlaceholder")} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("routes.baseRate")}</label>
              <input type="number" value={form.baseRate} onChange={(e) => setForm({ ...form, baseRate: e.target.value })} placeholder={t("routes.baseRatePlaceholder")} className="w-full p-2 border rounded-md" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("common.status")}</label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="routeIsActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                <span className="text-sm">{t("routes.active")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="routeIsActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-destructive" />
                <span className="text-sm">{t("routes.inactive")}</span>
              </label>
            </div>
          </div>

          <RouteStopsEditor
            value={form.stops}
            cities={cities}
            stations={stations}
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
