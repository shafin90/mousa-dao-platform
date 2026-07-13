import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Pencil,
  Bus as BusIcon,
  Route as RouteIcon,
  Clock,
  Coins,
  Users,
  Armchair,
  CalendarClock,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { DataTable } from "@/shared/components/tables/DataTable";
import { StopsCard } from "@/shared/components/stops/StopsCard";
import { cn } from "@/shared/utils/cn";
import { useAppSelector } from "@/app/store";
import { tripApi, type TripData } from "@/api/tripApi";
import { busApi, type BusData } from "@/api/busApi";
import { bookingApi, type BookingData } from "@/api/bookingApi";
import { cityApi, type CityData } from "@/api/cityApi";

const SEATS_PER_ROW = 4;
const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Builds the seat grid (rows of seat labels) matching the customer app scheme: row letter + 1..4. */
const buildSeatRows = (capacity: number): string[][] => {
  const rows: string[][] = [];
  let idx = 0;
  for (let r = 0; idx < capacity && r < ROW_LETTERS.length; r++) {
    const row: string[] = [];
    for (let c = 1; c <= SEATS_PER_ROW && idx < capacity; c++) {
      row.push(`${ROW_LETTERS[r]}${c}`);
      idx++;
    }
    rows.push(row);
  }
  return rows;
};

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; hint?: string }> = ({
  icon,
  label,
  value,
  hint,
}) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{value}</span>
  </div>
);

const tripStatusVariant = (status: TripData["status"]) => {
  switch (status) {
    case "active":
      return "success" as const;
    case "completed":
      return "secondary" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "warning" as const;
  }
};

const bookingStatusVariant = (status: string) => {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "warning" as const;
  }
};

const paymentVariant = (status: string) => {
  switch (status) {
    case "paid":
      return "success" as const;
    case "refunded":
      return "secondary" as const;
    default:
      return "warning" as const;
  }
};

const diffMinutes = (departure?: string, arrival?: string): number | null => {
  if (!departure || !arrival) return null;
  const [dh, dm] = departure.split(":").map(Number);
  const [ah, am] = arrival.split(":").map(Number);
  if ([dh, dm, ah, am].some((n) => Number.isNaN(n))) return null;
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins < 0) mins += 24 * 60;
  return mins;
};

const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const TripDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tripFromStore = useAppSelector((s) => s.trips.items.find((tr) => tr._id === id));
  const [trip, setTrip] = useState<TripData | null>(tripFromStore ?? null);
  const [bus, setBus] = useState<BusData | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(!tripFromStore);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [serial, setSerial] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const tripData = await tripApi.getById(id).catch(() => tripFromStore ?? null);
        if (!active) return;
        if (!tripData) {
          setNotFound(true);
          return;
        }
        setTrip(tripData);
        const busId = idOf(tripData.busId);
        if (busId) {
          const busData = await busApi.getById(busId).catch(() => null);
          if (active && busData) setBus(busData);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      setBookingsLoading(true);
      try {
        const res = await bookingApi.getAll({ limit: 200, tripId: id });
        if (active) setBookings(res.bookings || []);
      } catch {
        if (active) setBookings([]);
      } finally {
        if (active) setBookingsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await cityApi.getAll();
        if (active) setCities(data);
      } catch {
        if (active) setCities([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!trip?.date) return;
    let active = true;
    (async () => {
      try {
        const dateKey = new Date(trip.date).toISOString().slice(0, 10);
        const sameDay = await tripApi.getAll({ date: dateKey });
        const sorted = [...sameDay].sort((a, b) =>
          (a.departureTime || "").localeCompare(b.departureTime || "")
        );
        const idx = sorted.findIndex((tr) => tr._id === trip._id);
        if (active) setSerial(idx >= 0 ? idx + 1 : null);
      } catch {
        if (active) setSerial(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [trip?._id, trip?.date]);

  const metrics = useMemo(() => {
    if (!trip) return null;
    const seatsAvailable = Math.max((trip.seatsTotal || 0) - (trip.seatsBooked || 0), 0);
    const occupancy = trip.seatsTotal > 0 ? ((trip.seatsBooked || 0) / trip.seatsTotal) * 100 : 0;
    const revenueBooked = (trip.seatsBooked || 0) * (trip.price || 0);
    const revenuePotential = (trip.seatsTotal || 0) * (trip.price || 0);
    const scheduledDuration =
      typeof trip.routeId === "object" ? trip.routeId?.estimatedTimeMinutes : undefined;
    const duration = diffMinutes(trip.departureTime, trip.arrivalTime) ?? scheduledDuration ?? null;
    return { seatsAvailable, occupancy, revenueBooked, revenuePotential, duration };
  }, [trip]);

  const bookedSeats = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== "cancelled")
        .flatMap((b) => b.seats || []),
    [bookings]
  );

  const route = trip && typeof trip.routeId === "object" ? trip.routeId : undefined;
  const routeLabel = route
    ? `${route.fromStation?.name || "?"} → ${route.toStation?.name || "?"}`
    : t("common.na");

  const bookingColumns = [
    {
      header: t("bookings.bookingCode"),
      accessor: (b: BookingData) => <span className="font-mono text-xs">{b.bookingCode || "—"}</span>,
    },
    {
      header: t("trips.passenger"),
      accessor: (b: BookingData) =>
        b.userId?.profile
          ? `${b.userId.profile.firstName || ""} ${b.userId.profile.lastName || ""}`.trim() || t("common.na")
          : b.userId?.email || t("common.na"),
    },
    {
      header: t("trips.seatsLabel"),
      accessor: (b: BookingData) => (b.seats?.length ? b.seats.join(", ") : "—"),
    },
    {
      header: t("trips.amount"),
      accessor: (b: BookingData) => <span className="font-medium">CFA ${b.totalAmount?.toFixed(2) ?? "0.00"}</span>,
    },
    {
      header: t("common.status"),
      accessor: (b: BookingData) => (
        <Badge variant={bookingStatusVariant(b.status)}>{t(`bookings.${b.status}`, b.status)}</Badge>
      ),
    },
    {
      header: t("trips.payment"),
      accessor: (b: BookingData) => (
        <Badge variant={paymentVariant(b.paymentStatus)}>
          {t(`bookings.${b.paymentStatus}`, b.paymentStatus)}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/trips")}>
          <ArrowLeft size={16} /> {t("trips.backToTrips")}
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">{t("trips.notFound")}</CardContent>
        </Card>
      </div>
    );
  }

  const busType = bus?.type || (typeof trip.busId === "object" ? trip.busId?.type : undefined);
  const busCapacity = bus?.capacity ?? (typeof trip.busId === "object" ? trip.busId?.capacity : undefined);
  const busNumber = bus?.busNumber || (typeof trip.busId === "object" ? trip.busId?.busNumber : undefined);
  const busName = bus?.name || (typeof trip.busId === "object" ? trip.busId?.name : undefined);
  const features = bus?.features ? Object.entries(bus.features).filter(([, v]) => !!v).map(([k]) => k) : [];

  const seatCapacity = busCapacity ?? trip.seatsTotal ?? 0;
  const seatRows = buildSeatRows(seatCapacity);
  const bookedSet = new Set(bookedSeats);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/trips")}>
            <ArrowLeft size={16} /> {t("trips.backToTrips")}
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <RouteIcon size={22} className="text-primary" />
              {routeLabel}
            </h1>
            {serial != null && (
              <Badge variant="default">{`${t("trips.tripNo")}${serial}`}</Badge>
            )}
            <Badge variant={tripStatusVariant(trip.status)}>{t(`trips.${trip.status}`)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(trip.date).toLocaleDateString()} · {trip.departureTime} → {trip.arrivalTime}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{trip._id}</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            navigate("/trips", { state: { editTripId: trip._id } });
            toast.info(t("trips.editFromList"));
          }}
        >
          <Pencil size={16} /> {t("common.edit")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Coins size={18} />}
          label={t("trips.price")}
          value={`CFA $${trip.price?.toFixed(2) ?? "0.00"}`}
        />
        <StatCard
          icon={<Armchair size={18} />}
          label={t("trips.seatsAvailable")}
          value={`${metrics?.seatsAvailable ?? 0}`}
          hint={`${trip.seatsBooked || 0} / ${trip.seatsTotal || 0} ${t("trips.booked")}`}
        />
        <StatCard
          icon={<Users size={18} />}
          label={t("trips.occupancyLabel")}
          value={`${metrics?.occupancy.toFixed(0) ?? 0}%`}
        />
        <StatCard
          icon={<Wallet size={18} />}
          label={t("trips.revenue")}
          value={`CFA ${metrics?.revenueBooked.toFixed(2) ?? "0.00"}`}
          hint={`${t("trips.ofPotential", { value: `CFA ${metrics?.revenuePotential.toFixed(2) ?? "0.00"}` })}`}
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">{t("trips.occupancyLabel")}</span>
            <span className="text-muted-foreground">
              {trip.seatsBooked || 0} / {trip.seatsTotal || 0}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(metrics?.occupancy ?? 0, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BusIcon size={18} className="text-primary" /> {t("trips.busDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label={t("fleet.busNumber")} value={busNumber || t("common.na")} />
            <InfoRow label={t("fleet.name")} value={busName || t("common.na")} />
            <InfoRow label={t("fleet.type")} value={busType ? <Badge variant="outline">{busType}</Badge> : t("common.na")} />
            <InfoRow label={t("fleet.capacity")} value={busCapacity ?? t("common.na")} />
            {bus?.status && (
              <InfoRow
                label={t("common.status")}
                value={<Badge variant={bus.status === "active" ? "success" : "secondary"}>{bus.status}</Badge>}
              />
            )}
            <InfoRow
              label={t("fleet.driver")}
              value={
                bus?.assignedDriver?.profile
                  ? `${bus.assignedDriver.profile.firstName} ${bus.assignedDriver.profile.lastName}`
                  : t("fleet.unassigned")
              }
            />
            {features.length > 0 && (
              <div className="pt-2">
                <p className="mb-1 text-sm text-muted-foreground">{t("trips.amenities")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {features.map((f) => (
                    <Badge key={f} variant="secondary">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <RouteIcon size={18} className="text-primary" /> {t("trips.routeDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label={t("routes.fromStation")} value={route?.fromStation?.name || t("common.na")} />
            <InfoRow label={t("routes.toStation")} value={route?.toStation?.name || t("common.na")} />
            <InfoRow
              label={t("routes.distance")}
              value={route?.distanceKm != null ? t("routes.distanceValue", { value: route.distanceKm }) : t("common.na")}
            />
            <InfoRow
              label={t("routes.baseFare")}
              value={route?.baseFare != null ? `CFA $${route.baseFare.toFixed(2)}` : t("common.na")}
            />
            {route?.baseFare != null && trip.price != null && (
              <InfoRow
                label={t("trips.priceVsBase")}
                value={
                  <span className={trip.price >= route.baseFare ? "text-emerald-600" : "text-amber-600"}>
                    {trip.price >= route.baseFare ? "+" : ""}
                    CFA ${(trip.price - route.baseFare).toFixed(2)}
                  </span>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={18} className="text-primary" /> {t("trips.schedule")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label={t("trips.date")} value={new Date(trip.date).toLocaleDateString()} />
            <InfoRow label={t("trips.departure")} value={trip.departureTime} />
            <InfoRow label={t("trips.tripNumber")} value={serial != null ? `#${serial}` : t("common.na")} />
            <InfoRow label={t("trips.arrival")} value={trip.arrivalTime} />
            <InfoRow label={t("routes.estTime")} value={formatDuration(metrics?.duration)} />
            <InfoRow label={t("trips.createdAt")} value={new Date(trip.createdAt).toLocaleString()} />
            {trip.updatedAt && (
              <InfoRow label={t("routes.updatedAt")} value={new Date(trip.updatedAt).toLocaleString()} />
            )}
          </CardContent>
        </Card>
      </div>

      <StopsCard stops={route?.stops ?? []} cities={cities} />

      {seatCapacity > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Armchair size={18} className="text-primary" /> {t("trips.seatMap")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded border bg-secondary" /> {t("trips.seatAvailable")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-primary" /> {t("trips.seatBooked")}
              </span>
            </div>
            <div className="inline-flex flex-col gap-2 overflow-x-auto rounded-lg border bg-muted/20 p-4">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {t("trips.front")}
              </p>
              {seatRows.map((row, ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <span className="w-4 text-center text-xs font-semibold text-muted-foreground">
                    {ROW_LETTERS[ri]}
                  </span>
                  {row.map((seat, ci) => {
                    const booked = bookedSet.has(seat);
                    return (
                      <span
                        key={seat}
                        title={seat}
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-medium",
                          ci === 2 && "ml-5",
                          booked
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "border bg-secondary text-foreground"
                        )}
                      >
                        {seat}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("trips.seatsBookedCount", { booked: bookedSeats.length, total: seatCapacity })}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User size={18} className="text-primary" /> {t("trips.passengerManifest")}
          </CardTitle>
          <Badge variant="outline">{t("trips.totalBookings", { count: bookings.length })}</Badge>
        </CardHeader>
        <CardContent>
          <DataTable columns={bookingColumns} data={bookings} isLoading={bookingsLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-2 p-5 text-sm">
          <CalendarClock size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground">{t("trips.tripId")}:</span>
          <span className="font-mono">{trip._id}</span>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripDetailsPage;
