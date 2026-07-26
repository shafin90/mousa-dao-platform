import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useTrips } from "../hooks/useTrips";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2, Search, X, AlertTriangle } from "lucide-react";
import { Modal } from "@/shared/components/modals/Modal";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { busApi, type BusData } from "@/api/busApi";
import { stationApi, type StationData } from "@/api/stationApi";
import { tripApi, type TripData, type TripInput, type TripFilters } from "@/api/tripApi";

const statusOptions = ["scheduled", "active", "completed", "cancelled"];

const TripsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useErrorModal();

  const [filterBusId, setFilterBusId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const filters = useMemo<TripFilters>(() => {
    const f: TripFilters = {};
    if (filterBusId) f.busId = filterBusId;
    if (filterDate) f.date = filterDate;
    if (filterStatus) f.status = filterStatus;
    if (filterPriceMin) f.priceMin = Number(filterPriceMin);
    if (filterPriceMax) f.priceMax = Number(filterPriceMax);
    if (filterSearch) f.search = filterSearch;
    return f;
  }, [filterBusId, filterDate, filterStatus, filterPriceMin, filterPriceMax, filterSearch]);

  const { isAdmin } = useAuth();
  const { trips, loading, update, refresh } = useTrips(filters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripData | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [stations, setStations] = useState<StationData[]>([]);
  const [busesLoading, setBusesLoading] = useState(false);
  const [form, setForm] = useState({ fromStation: "", toStation: "", busId: "", departureTime: "", arrivalTime: "", date: "", price: "", status: "scheduled" });

  const openEdit = (item: TripData) => {
    setEditingTripId(item._id);
    setForm({
      fromStation: item.routeId?.fromCity?._id || "",
      toStation: item.routeId?.toCity?._id || "",
      busId: typeof item.busId === "string" ? item.busId : item.busId?._id || "",
      departureTime: item.departureTime,
      arrivalTime: item.arrivalTime,
      date: item.date?.split("T")[0] || item.date,
      price: String(item.price || ""),
      status: item.status || "scheduled",
    });
    setIsModalOpen(true);
  };

  const fetchBuses = async () => {
    setBusesLoading(true);
    try { const data = await busApi.getAll(); setBuses(data.buses || []); }
    catch { showError(t("trips.busesLoadFailed")); }
    finally { setBusesLoading(false); }
  };

  useEffect(() => { fetchBuses(); stationApi.getAll().then(setStations).catch(() => setStations([])); }, []);
  useEffect(() => {
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
    setFilterBusId("");
    setFilterDate("");
    setFilterStatus("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterSearch("");
  };

  const compactHasFilters = filterSearch || filterBusId || filterDate || filterStatus;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTripId) return;
    try {
      const payload: TripInput = {
        fromStation: form.fromStation,
        toStation: form.toStation,
        busId: form.busId,
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime,
        date: form.date,
        price: Number(form.price),
        status: form.status,
      }
      await update(editingTripId, payload);
      toast.success(t("trips.updated"));
      setIsModalOpen(false);
      setEditingTripId(null);
      setForm({ fromStation: "", toStation: "", busId: "", departureTime: "", arrivalTime: "", date: "", price: "", status: "scheduled" });
    } catch { showError(t("trips.saveFailed")); }
  };

  const stationOptions = stations.map((s) => ({
    value: s._id,
    label: `${s.name} (${s.cityId?.name || "?"})`,
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
    { header: t("trips.from"), accessor: (item: TripData) => item.routeId?.fromCity?.name || "" },
    { header: t("trips.to"), accessor: (item: TripData) => item.routeId?.toCity?.name || "" },
    { header: t("trips.date"), accessor: (item: TripData) => new Date(item.date).toLocaleDateString() },
    { header: t("trips.departure"), accessor: (item: TripData) => item.departureTime },
    { header: t("trips.bus"), accessor: (item: TripData) => item.busId?.busNumber || item.busId?._id || t("common.na") },
    { header: t("trips.seats"), accessor: (item: TripData) => `${item.seatsBooked || 0} / ${item.seatsTotal || 0}` },
    { header: t("trips.price"), accessor: (item: TripData) => `CFA ${item.price || 0}` },
    {
      header: t("trips.actions"),
      accessor: (item: TripData) => (
        <div className="flex gap-1">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={async (e) => {
                e.stopPropagation();
                const newStatus = item.status === "active" ? "cancelled" : item.status === "cancelled" ? "scheduled" : "active";
                try { await tripApi.updateStatus(item._id, newStatus); toast.success(t("trips.updated")); refresh(); }
                catch { showError(t("trips.saveFailed")); }
              }}>
                {item.status === "active" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              </Button>
              <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setTripToDelete(item); setIsDeleteOpen(true); }}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div data-tour="trips-table">
        <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
          <div className="relative flex-1 min-w-[160px] max-w-[220px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search route / bus..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full h-7 pl-8 pr-7 rounded border bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {filterSearch && (
              <button onClick={() => setFilterSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterBusId}
              onChange={(e) => setFilterBusId(e.target.value)}
              className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Buses</option>
              {buses.map((b) => (
                <option key={b._id} value={b._id}>{b.busNumber} - {b.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{t(`trips.${s}`)}</option>
              ))}
            </select>
            <div className="w-px h-5 bg-border" />
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={refresh} title="Refresh"><RefreshCw size={13} /></Button>
            {isAdmin && (
              <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate("/trips/new")}>
                <Plus size={13} /> Add
              </Button>
            )}
            {compactHasFilters && (
              <button onClick={clearFilters} className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>
        <DataTable className="rounded-t-none border-t-0" columns={columns} data={trips} isLoading={loading} onRowClick={(item) => navigate(`/trips/${item._id}`)} /></div>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setTripToDelete(null); }} title={t("trips.deleteTrip")}>
        {tripToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("trips.confirmDelete", { date: new Date(tripToDelete.date).toLocaleDateString(), time: tripToDelete.departureTime })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setTripToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={async () => {
                try {
                  await tripApi.delete(tripToDelete._id);
                  toast.success(t("trips.deleted"));
                  setIsDeleteOpen(false);
                  setTripToDelete(null);
                  refresh();
                } catch { showError(t("trips.saveFailed")); }
              }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDeleteAllOpen} onClose={() => setIsDeleteAllOpen(false)} title={t("trips.deleteAllTitle")}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-destructive" />
            <p className="text-sm text-muted-foreground">{t("trips.confirmDeleteAll", { count: trips.length })}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteAllOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={async () => {
              try {
                const count = await tripApi.deleteAll();
                toast.success(t("trips.deletedAll", { count }));
                setIsDeleteAllOpen(false);
                refresh();
              } catch {
                showError(t("trips.saveFailed"));
              }
            }}>{t("common.delete")}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTripId(null); }} title={editingTripId ? t("trips.editTrip") : t("trips.scheduleNewTrip")}>
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("trips.fromStation")}</label>
              <Select
                required
                value={form.fromStation}
                onChange={(e) => setForm({...form, fromStation: e.target.value})}
                options={stationOptions}
                placeholder={t("trips.selectFromStation")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("trips.toStation")}</label>
              <Select
                required
                value={form.toStation}
                onChange={(e) => setForm({...form, toStation: e.target.value})}
                options={stationOptions}
                placeholder={t("trips.selectToStation")}
              />
            </div>
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
