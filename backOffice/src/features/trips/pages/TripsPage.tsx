import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useTrips } from "../hooks/useTrips";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { Plus, RefreshCw, Eye, Pencil, Trash2, Search, X } from "lucide-react";
import { Modal } from "@/shared/components/modals/Modal";
import { toast } from "sonner";
import { routeApi, type RouteData } from "@/api/routeApi";
import { busApi, type BusData } from "@/api/busApi";
import type { TripData, TripFilters } from "@/api/tripApi";

const statusOptions = ["scheduled", "active", "completed", "cancelled"];

const TripsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [filterRouteId, setFilterRouteId] = useState("");
  const [filterBusId, setFilterBusId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const filters = useMemo<TripFilters>(() => {
    const f: TripFilters = {};
    if (filterRouteId) f.routeId = filterRouteId;
    if (filterBusId) f.busId = filterBusId;
    if (filterDate) f.date = filterDate;
    if (filterStatus) f.status = filterStatus;
    if (filterPriceMin) f.priceMin = Number(filterPriceMin);
    if (filterPriceMax) f.priceMax = Number(filterPriceMax);
    if (filterSearch) f.search = filterSearch;
    return f;
  }, [filterRouteId, filterBusId, filterDate, filterStatus, filterPriceMin, filterPriceMax, filterSearch]);

  const { trips, loading, create, update, remove, refresh } = useTrips(filters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripData | null>(null);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [busesLoading, setBusesLoading] = useState(false);
  const [form, setForm] = useState({ routeId: "", busId: "", departureTime: "", arrivalTime: "", date: "", price: "", status: "scheduled" });

  const openEdit = (item: TripData) => {
    setEditingTripId(item._id);
    setForm({
      routeId: typeof item.routeId === "string" ? item.routeId : item.routeId?._id || "",
      busId: typeof item.busId === "string" ? item.busId : item.busId?._id || "",
      departureTime: item.departureTime,
      arrivalTime: item.arrivalTime,
      date: item.date?.split("T")[0] || item.date,
      price: String(item.price || ""),
      status: item.status || "scheduled",
    });
    setIsModalOpen(true);
  };

  const fetchRoutes = async () => {
    setRoutesLoading(true);
    try { setRoutes(await routeApi.getAll()); }
    catch { toast.error(t("trips.routesLoadFailed")); }
    finally { setRoutesLoading(false); }
  };

  const fetchBuses = async () => {
    setBusesLoading(true);
    try { const data = await busApi.getAll(); setBuses(data.buses || []); }
    catch { toast.error(t("trips.busesLoadFailed")); }
    finally { setBusesLoading(false); }
  };

  useEffect(() => { fetchRoutes(); fetchBuses(); }, []);
  useEffect(() => {
    if (isModalOpen && routes.length === 0) fetchRoutes();
    if (isModalOpen && buses.length === 0) fetchBuses();
  }, [isModalOpen]);

  useEffect(() => {
    const editId = (location.state as { editTripId?: string } | null)?.editTripId;
    if (editId && trips.length > 0) {
      const target = trips.find((tr) => tr._id === editId);
      if (target) openEdit(target);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, trips]);

  const clearFilters = () => {
    setFilterRouteId("");
    setFilterBusId("");
    setFilterDate("");
    setFilterStatus("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterSearch("");
  };

  const hasFilters = filterRouteId || filterBusId || filterDate || filterStatus || filterPriceMin || filterPriceMax || filterSearch;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        routeId: form.routeId as unknown as TripData["routeId"],
        busId: form.busId as unknown as TripData["busId"],
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime,
        date: form.date,
        price: Number(form.price),
        status: form.status as TripData["status"],
      } as Partial<TripData>;
      if (editingTripId) {
        await update(editingTripId, payload);
        toast.success(t("trips.updated"));
      } else {
        await create(payload);
        toast.success(t("trips.created"));
      }
      setIsModalOpen(false);
      setEditingTripId(null);
      setForm({ routeId: "", busId: "", departureTime: "", arrivalTime: "", date: "", price: "", status: "scheduled" });
    } catch { toast.error(t("trips.saveFailed")); }
  };

  const routeOptions = routes.map((r) => ({
    value: r._id,
    label: `${r.fromStation?.name || '?'} → ${r.toStation?.name || '?'}`,
  }));

  const busOptions = buses.map((b) => ({
    value: b._id,
    label: `${b.busNumber} - ${b.name} (${b.capacity} seats)`,
  }));

  const serialByTripId = useMemo(() => {
    const byDate: Record<string, TripData[]> = {};
    for (const tr of trips) {
      const key = new Date(tr.date).toDateString();
      (byDate[key] ||= []).push(tr);
    }
    const map = new Map<string, number>();
    Object.values(byDate).forEach((list) => {
      [...list]
        .sort((a, b) => (a.departureTime || "").localeCompare(b.departureTime || ""))
        .forEach((tr, idx) => map.set(tr._id, idx + 1));
    });
    return map;
  }, [trips]);

  const columns = [
    {
      header: t("trips.tripNo"),
      className: "w-16",
      accessor: (item: TripData) => (
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
          {serialByTripId.get(item._id) ?? "-"}
        </span>
      ),
    },
    { header: t("trips.route"), accessor: (item: TripData) => item.routeId ? `${item.routeId.fromStation?.name || ''} → ${item.routeId.toStation?.name || ''}` : t("common.na") },
    { header: t("trips.date"), accessor: (item: TripData) => new Date(item.date).toLocaleDateString() },
    { header: t("trips.departure"), accessor: (item: TripData) => item.departureTime },
    { header: t("trips.bus"), accessor: (item: TripData) => item.busId?.busNumber || item.busId?._id || t("common.na") },
    { header: t("trips.seats"), accessor: (item: TripData) => `${item.seatsBooked || 0} / ${item.seatsTotal || 0}` },
    { header: t("trips.price"), accessor: (item: TripData) => `CFA ${item.price || 0}` },
    { header: t("trips.status"), accessor: (item: TripData) => {
        const variants: Record<string, "success"|"warning"|"destructive"|"secondary"> = { scheduled: "warning", active: "success", completed: "secondary", cancelled: "destructive" };
        return <Badge variant={variants[item.status] || "outline"}>{t(`trips.${item.status}`, { defaultValue: item.status?.toUpperCase() })}</Badge>;
    }},
    {
      header: t("trips.actions"),
      accessor: (item: TripData) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/trips/${item._id}`); }}>
            <Eye size={14} className="mr-1" /> {t("trips.viewDetails")}
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            openEdit(item);
          }}>
            <Pencil size={14} />
          </Button>
          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setTripToDelete(item); setIsDeleteOpen(true); }}>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("trips.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("trips.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}><RefreshCw size={16} /> {t("common.refresh")}</Button>
          <Button size="sm" className="gap-2" onClick={() => { setEditingTripId(null); setForm({ routeId: "", busId: "", departureTime: "", arrivalTime: "", date: "", price: "", status: "scheduled" }); setIsModalOpen(true); }}><Plus size={16} /> {t("trips.scheduleTrip")}</Button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={`${t("common.search")} route / bus...`}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterRouteId}
            onChange={(e) => setFilterRouteId(e.target.value)}
            className="h-9 min-w-[160px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("trips.selectRoute")}</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.fromStation?.name || '?'} → {r.toStation?.name || '?'}
              </option>
            ))}
          </select>
          <select
            value={filterBusId}
            onChange={(e) => setFilterBusId(e.target.value)}
            className="h-9 min-w-[160px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("trips.selectBus")}</option>
            {buses.map((b) => (
              <option key={b._id} value={b._id}>
                {b.busNumber} - {b.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 min-w-[130px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("trips.status")}</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{t(`trips.${s}`)}</option>
            ))}
          </select>
          <input
            type="number"
placeholder="Min CFA"
             value={filterPriceMin}
             onChange={(e) => setFilterPriceMin(e.target.value)}
             className="h-9 w-[120px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
           />
           <input
             type="number"
             placeholder="Max CFA"
            value={filterPriceMax}
            onChange={(e) => setFilterPriceMax(e.target.value)}
            className="h-9 w-[100px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} className="mr-1" /> {t("common.clear")}
            </Button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={trips} isLoading={loading} onRowClick={(item) => navigate(`/trips/${item._id}`)} />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setTripToDelete(null); }} title={t("trips.deleteTrip")}>
        {tripToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("trips.confirmDelete", { date: new Date(tripToDelete.date).toLocaleDateString(), time: tripToDelete.departureTime })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setTripToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={() => { remove(tripToDelete._id); toast.success(t("trips.deleted")); setIsDeleteOpen(false); setTripToDelete(null); }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTripId(null); }} title={editingTripId ? t("trips.editTrip") : t("trips.scheduleNewTrip")}>
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("trips.route")}</label>
            <Select
              required
              value={form.routeId}
              onChange={(e) => setForm({...form, routeId: e.target.value})}
              options={routeOptions}
              placeholder={routesLoading ? t("trips.loadingRoutes") : t("trips.selectRoute")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("trips.bus")}</label>
            <Select
              required
              value={form.busId}
              onChange={(e) => setForm({...form, busId: e.target.value})}
              options={busOptions}
              placeholder={busesLoading ? t("trips.loadingBuses") : t("trips.selectBus")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("trips.date")}</label>
              <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("trips.departure")}</label>
              <input required type="time" value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("trips.arrival")}</label>
            <input required type="time" value={form.arrivalTime} onChange={e => setForm({...form, arrivalTime: e.target.value})} className="w-full p-2 border rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("trips.price")}</label>
              <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("trips.status")}</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="scheduled">{t("trips.scheduled")}</option>
                <option value="active">{t("trips.active")}</option>
                <option value="completed">{t("trips.completed")}</option>
                <option value="cancelled">{t("trips.cancelled")}</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit">{editingTripId ? t("common.update") : t("common.create")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TripsPage;
