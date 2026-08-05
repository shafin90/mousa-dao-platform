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
  Armchair,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { tripApi, type TripInput } from "@/api/tripApi";
import { busApi, type BusData } from "@/api/busApi";
import { stationApi, type StationData } from "@/api/stationApi";
import { cn } from "@/shared/utils/cn";

const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const buildSeatRows = (capacity: number, seatRows?: number, leftSeats?: number, rightSeats?: number): string[][] => {
  const left = leftSeats ?? 2;
  const right = rightSeats ?? 2;
  const seatsPerRow = left + right;
  const rows = seatRows ?? Math.ceil(capacity / seatsPerRow);
  const result: string[][] = [];
  let idx = 0;
  for (let r = 0; r < rows && idx < capacity; r++) {
    const row: string[] = [];
    for (let c = 1; c <= seatsPerRow && idx < capacity; c++) {
      row.push(`${ROW_LETTERS[r]}${c}`);
      idx++;
    }
    result.push(row);
  }
  return result;
};

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
  const [blockedSeats, setBlockedSeats] = useState<string[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [togglingSeat, setTogglingSeat] = useState<string | null>(null);

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
        setBlockedSeats(trip.blockedSeats || []);
      })
      .catch(() => showError(t("trips.notFound")))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!form.busId) return;
    let cancelled = false;
    busApi.getById(form.busId)
      .then((b) => { if (!cancelled) setSelectedBus(b); })
      .catch(() => { if (!cancelled) setSelectedBus(null); });
    return () => { cancelled = true; };
  }, [form.busId]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    import("@/api/bookingApi").then(({ bookingApi }) =>
      bookingApi.getAll({ tripId: id, limit: 500 })
        .then((res) => {
          if (!cancelled) {
            const seats = (res.bookings || [])
              .filter((b: { status: string }) => b.status !== "cancelled")
              .flatMap((b: { seats?: string[] }) => b.seats || []);
            setBookedSeats(seats);
          }
        })
        .catch(() => { if (!cancelled) setBookedSeats([]); })
    );
    return () => { cancelled = true; };
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

  const toggleBlockSeat = async (seatLabel: string) => {
    if (!id || togglingSeat) return;
    setTogglingSeat(seatLabel);
    const isCurrentlyBlocked = blockedSeats.includes(seatLabel);
    const nextBlocked = isCurrentlyBlocked
      ? blockedSeats.filter((s) => s !== seatLabel)
      : [...blockedSeats, seatLabel];
    try {
      await tripApi.update(id, { blockedSeats: nextBlocked });
      setBlockedSeats(nextBlocked);
      toast.success(isCurrentlyBlocked ? t("trips.seatUnblocked") : t("trips.seatBlocked"));
    } catch {
      showError(t("trips.seatBlockFailed"));
    } finally {
      setTogglingSeat(null);
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

        {selectedBus && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Armchair size={18} className="text-primary" /> {t("trips.seatMap")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("trips.blockSeatHint")}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded border bg-secondary" /> {t("trips.seatAvailable")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded bg-primary" /> {t("trips.seatBooked")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded bg-destructive" /> {t("trips.seatBlocked")}
                </span>
              </div>
              <div className="inline-flex flex-col gap-2 overflow-x-auto rounded-lg border bg-muted/20 p-4">
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {t("trips.front")}
                </p>
                {buildSeatRows(
                  selectedBus.capacity,
                  selectedBus.seatRows,
                  selectedBus.leftSeats,
                  selectedBus.rightSeats
                ).map((row, ri) => (
                  <div key={ri} className="flex items-center gap-2">
                    <span className="w-4 text-center text-xs font-semibold text-muted-foreground">
                      {ROW_LETTERS[ri]}
                    </span>
                    {row.map((seat, ci) => {
                      const isBooked = bookedSeats.includes(seat);
                      const isBlocked = blockedSeats.includes(seat);
                      const leftCount = selectedBus.leftSeats ?? 2;
                      return (
                        <button
                          key={seat}
                          type="button"
                          title={isBooked ? seat : isBlocked ? `${seat} (${t("trips.blocked")})` : `${seat} (${t("trips.clickToBlock")})`}
                          disabled={isBooked || togglingSeat === seat}
                          onClick={() => toggleBlockSeat(seat)}
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-medium transition-all",
                            ci === leftCount && "ml-5",
                            isBooked
                              ? "bg-primary text-primary-foreground shadow-sm cursor-not-allowed"
                              : isBlocked
                                ? "bg-destructive text-destructive-foreground shadow-sm cursor-pointer hover:bg-destructive/80"
                                : "border bg-secondary text-foreground cursor-pointer hover:border-destructive hover:text-destructive"
                          )}
                        >
                          {togglingSeat === seat ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            seat
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("trips.seatsBlockedCount", { blocked: blockedSeats.length, total: selectedBus.capacity })}
              </p>
            </CardContent>
          </Card>
        )}

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
