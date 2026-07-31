import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bus,
  Save,
  X,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { tripApi, type TripInput } from "@/api/tripApi";
import { busApi, type BusData } from "@/api/busApi";
import { stationApi, type StationData } from "@/api/stationApi";

const TripEditPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showError } = useErrorModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fromStation: "", toStation: "", busId: "", departureTime: "", arrivalTime: "", date: "", price: "", status: "scheduled" });
  const [buses, setBuses] = useState<BusData[]>([]);
  const [stations, setStations] = useState<StationData[]>([]);
  const [busesLoading, setBusesLoading] = useState(false);

  useEffect(() => {
    const fetchBuses = async () => {
      setBusesLoading(true);
      try { const data = await busApi.getAll(); setBuses(data.buses || []); }
      catch { showError(t("trips.busesLoadFailed")); }
      finally { setBusesLoading(false); }
    };
    fetchBuses();
    stationApi.getAll().then(setStations).catch(() => setStations([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    tripApi.getById(id)
      .then((trip) => {
        if (cancelled) return;
        setForm({
          fromStation: trip.fromStation?._id || "",
          toStation: trip.toStation?._id || "",
          busId: typeof trip.busId === "string" ? trip.busId : trip.busId?._id || "",
          departureTime: trip.departureTime || "",
          arrivalTime: trip.arrivalTime || "",
          date: trip.date?.split("T")[0] || trip.date || "",
          price: String(trip.price ?? ""),
          status: trip.status || "scheduled",
        });
      })
      .catch(() => showError(t("trips.notFound")))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const stationOptions = stations.map((s) => ({
    value: s._id,
    label: `${s.name} (${s.cityId?.name || "?"})`,
  }));

  const busOptions = buses.map((b) => ({
    value: b._id,
    label: `${b.busNumber} - ${b.name} (${b.capacity} seats)`,
  }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
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
      };
      await tripApi.update(id, payload);
      toast.success(t("trips.updated"));
      navigate(`/trips/${id}`);
    } catch {
      showError(t("trips.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate(`/trips/${id}`)}>
            <ArrowLeft size={16} /> {t("trips.backToTrips")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bus size={22} className="text-primary" />
            {t("trips.editTrip")}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={18} className="text-primary" /> {t("trips.fromStation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">{t("trips.fromStation")}</label>
                  <Select
                    required
                    value={form.fromStation}
                    onChange={(e) => setForm({...form, fromStation: e.target.value})}
                    options={stationOptions}
                    placeholder={t("trips.selectFromStation")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">{t("trips.toStation")}</label>
                  <Select
                    required
                    value={form.toStation}
                    onChange={(e) => setForm({...form, toStation: e.target.value})}
                    options={stationOptions}
                    placeholder={t("trips.selectToStation")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bus size={18} className="text-primary" /> {t("trips.bus")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">{t("trips.bus")}</label>
                  <Select
                    required
                    value={form.busId}
                    onChange={(e) => setForm({...form, busId: e.target.value})}
                    options={busOptions}
                    placeholder={busesLoading ? t("trips.loadingBuses") : t("trips.selectBus")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar size={18} className="text-primary" /> {t("trips.schedule")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">{t("trips.date")}</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">
                      <Clock size={14} className="inline mr-1" />{t("trips.departure")}
                    </label>
                    <input required type="time" value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">
                      <Clock size={14} className="inline mr-1" />{t("trips.arrival")}
                    </label>
                    <input required type="time" value={form.arrivalTime} onChange={e => setForm({...form, arrivalTime: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign size={18} className="text-primary" /> {t("trips.price")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">{t("trips.price")} (CFA)</label>
                  <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck size={18} className="text-primary" /> {t("trips.status")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="scheduled">{t("trips.scheduled")}</option>
                    <option value="active">{t("trips.active")}</option>
                    <option value="completed">{t("trips.completed")}</option>
                    <option value="cancelled">{t("trips.cancelled")}</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => navigate(`/trips/${id}`)}>
            <X size={16} /> {t("common.cancel")}
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save size={16} /> {saving ? t("common.saving") : t("common.update")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TripEditPage;
