import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Pencil,
  Bus as BusIcon,
  User,
  Armchair,
  Users,
  Wallet,
  Route as RouteIcon,
  MapPin,
  Gauge,
  Compass,
  Mail,
  Phone,
  CalendarClock,
  ShieldCheck,
  ShoppingCart,
  Wrench,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Modal } from "@/shared/components/modals/Modal";
import { cn } from "@/shared/utils/cn";
import { useAppSelector } from "@/app/store";
import { busApi, type BusData, type MaintenanceLog } from "@/api/busApi";
import { maintenanceFacilityApi, type MaintenanceFacilityData } from "@/api/maintenanceFacilityApi";
import { tripApi, type TripData } from "@/api/tripApi";
import { getActiveBuses, type GpsBus } from "@/features/tracking/api/trackingApi";

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

const busStatusVariant = (status?: string) => {
  switch (status) {
    case "active":
      return "success" as const;
    case "maintenance":
      return "warning" as const;
    case "inactive":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

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

const maintenanceTypeVariant = (type: MaintenanceLog["type"]) => {
  switch (type) {
    case "repair":
      return "destructive" as const;
    case "inspection":
      return "warning" as const;
    case "routine":
      return "success" as const;
    default:
      return "secondary" as const;
  }
};

const MAINTENANCE_EMPTY = { date: "", type: "routine", description: "", cost: "", odometer: "", performedBy: "", nextServiceDate: "", facilityId: "" };

const BusDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const busFromStore = useAppSelector((s) => s.fleet.items.find((b) => b._id === id));
  const [bus, setBus] = useState<BusData | null>(busFromStore ?? null);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [liveLocation, setLiveLocation] = useState<GpsBus | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(!busFromStore);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isMaintOpen, setIsMaintOpen] = useState(false);
  const [maintForm, setMaintForm] = useState({ ...MAINTENANCE_EMPTY });
  const [savingMaint, setSavingMaint] = useState(false);
  const [facilities, setFacilities] = useState<MaintenanceFacilityData[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const busData = await busApi.getById(id).catch(() => busFromStore ?? null);
        if (!active) return;
        if (!busData) {
          setNotFound(true);
          return;
        }
        setBus(busData);
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
      setTripsLoading(true);
      try {
        const data = await tripApi.getAll({ busId: id });
        if (active) setTrips(data);
      } catch {
        if (active) setTrips([]);
      } finally {
        if (active) setTripsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const loadMaintenance = React.useCallback(async () => {
    setMaintenanceLoading(true);
    try {
      const data = await busApi.getMaintenance(id);
      setMaintenance(data);
    } catch {
      setMaintenance([]);
    } finally {
      setMaintenanceLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMaintenance();
  }, [loadMaintenance]);

  useEffect(() => {
    maintenanceFacilityApi.getAll().then(setFacilities).catch(() => setFacilities([]));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const buses = await getActiveBuses();
        if (active) setLiveLocation(buses.find((b) => b.busNumber === bus?.busNumber) ?? null);
      } catch {
        if (active) setLiveLocation(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [bus?.busNumber]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const upcoming = trips.filter(
      (tr) => (tr.status === "scheduled" || tr.status === "active") && new Date(tr.date).getTime() >= now - 86_400_000
    ).length;
    const seatsTotal = trips.reduce((acc, tr) => acc + (tr.seatsTotal || 0), 0);
    const seatsBooked = trips.reduce((acc, tr) => acc + (tr.seatsBooked || 0), 0);
    const occupancy = seatsTotal > 0 ? (seatsBooked / seatsTotal) * 100 : null;
    const revenue = trips.reduce((acc, tr) => acc + (tr.seatsBooked || 0) * (tr.price || 0), 0);
    return { upcoming, occupancy, revenue };
  }, [trips]);

  const maintenanceCost = useMemo(() => maintenance.reduce((acc, m) => acc + (m.cost || 0), 0), [maintenance]);

  const amenities = useMemo(
    () =>
      bus?.features
        ? Object.entries(bus.features)
            .filter(([, v]) => !!v)
            .map(([k]) => k)
        : [],
    [bus?.features]
  );

  /** Returns badge variant + label key + formatted date for a compliance expiry date. */
  const expiryBadge = (iso?: string): { variant: "success" | "warning" | "destructive"; label: string } | null => {
    if (!iso) return null;
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
    if (days < 0) return { variant: "destructive", label: t("fleet.expired") };
    if (days <= 30) return { variant: "warning", label: t("fleet.expiringInDays", { count: days }) };
    return { variant: "success", label: t("fleet.valid") };
  };

  const ComplianceRow: React.FC<{ label: string; iso?: string }> = ({ label, iso }) => {
    const badge = expiryBadge(iso);
    return (
      <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2 text-right font-medium">
          {iso ? new Date(iso).toLocaleDateString() : t("common.na")}
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </span>
      </div>
    );
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMaint(true);
    try {
      await busApi.addMaintenanceLog(id, {
        date: maintForm.date,
        type: maintForm.type,
        description: maintForm.description,
        cost: maintForm.cost ? Number(maintForm.cost) : 0,
        odometer: maintForm.odometer ? Number(maintForm.odometer) : undefined,
        performedBy: maintForm.performedBy || undefined,
        nextServiceDate: maintForm.nextServiceDate || undefined,
        facilityId: maintForm.facilityId || undefined,
      });
      toast.success(t("fleet.maintenanceAdded"));
      setIsMaintOpen(false);
      setMaintForm({ ...MAINTENANCE_EMPTY });
      loadMaintenance();
    } catch {
      toast.error(t("fleet.maintenanceFailed"));
    } finally {
      setSavingMaint(false);
    }
  };

  const tripColumns = [
    { header: t("trips.date"), accessor: (tr: TripData) => new Date(tr.date).toLocaleDateString() },
    {
      header: t("routes.schedule"),
      accessor: (tr: TripData) => `${tr.departureTime} → ${tr.arrivalTime}`,
    },
    {
      header: t("trips.route"),
      accessor: (tr: TripData) =>
        tr.routeId?.fromStation?.name
          ? `${tr.routeId.fromStation.name} → ${tr.routeId.toStation?.name || "?"}`
          : t("common.na"),
    },
    {
      header: t("trips.price"),
      accessor: (tr: TripData) => <span className="font-medium">CFA {tr.price?.toFixed(2) ?? "0.00"}</span>,
    },
    {
      header: t("trips.seats"),
      accessor: (tr: TripData) => `${tr.seatsBooked ?? 0}/${tr.seatsTotal ?? 0}`,
    },
    {
      header: t("common.status"),
      accessor: (tr: TripData) => (
        <Badge variant={tripStatusVariant(tr.status)}>{t(`trips.${tr.status}`)}</Badge>
      ),
    },
  ];

  const maintenanceColumns = [
    { header: t("fleet.maintDate"), accessor: (m: MaintenanceLog) => new Date(m.date).toLocaleDateString() },
    {
      header: t("fleet.maintType"),
      accessor: (m: MaintenanceLog) => (
        <Badge variant={maintenanceTypeVariant(m.type)}>{t(`fleet.maint.${m.type}`, { defaultValue: m.type })}</Badge>
      ),
    },
    { header: t("fleet.maintDescription"), accessor: (m: MaintenanceLog) => m.description },
    { header: t("fleet.maintCost"), accessor: (m: MaintenanceLog) => <span className="font-medium">CFA {(m.cost || 0).toFixed(2)}</span> },
    { header: t("fleet.odometer"), accessor: (m: MaintenanceLog) => (m.odometer != null ? `${m.odometer} km` : "—") },
    {
      header: t("fleet.maintFacility"),
      accessor: (m: MaintenanceLog) => (m.facilityId && typeof m.facilityId === "object" ? m.facilityId.name : "—"),
    },
    { header: t("fleet.maintBy"), accessor: (m: MaintenanceLog) => m.performedBy || "—" },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !bus) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/fleet")}>
          <ArrowLeft size={16} /> {t("fleet.backToFleet")}
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">{t("fleet.notFound")}</CardContent>
        </Card>
      </div>
    );
  }

  const driver = bus.assignedDriver;
  const driverName = driver?.profile
    ? `${driver.profile.firstName || ""} ${driver.profile.lastName || ""}`.trim()
    : "";
  const seatRows = buildSeatRows(bus.capacity || 0);
  const makeModel = [bus.make, bus.model, bus.year].filter(Boolean).join(" ");
  const hasCompliance = bus.registrationExpiry || bus.insuranceExpiry || bus.fitnessExpiry || bus.insuranceProvider || bus.insuranceIssueDate || bus.lastInspectionDate;
  const hasPurchase = bus.purchaseDate || bus.purchaseCost != null || bus.homeDepot;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/fleet")}>
            <ArrowLeft size={16} /> {t("fleet.backToFleet")}
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <BusIcon size={22} className="text-primary" />
              {bus.busNumber}
            </h1>
            <Badge variant="outline">{bus.type}</Badge>
            <Badge variant={busStatusVariant(bus.status)}>
              {t(`fleet.${bus.status}`, { defaultValue: bus.status?.toUpperCase() })}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{makeModel ? `${bus.name} · ${makeModel}` : bus.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{bus._id}</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            navigate("/fleet", { state: { editBusId: bus._id } });
            toast.info(t("fleet.editBus"));
          }}
        >
          <Pencil size={16} /> {t("common.edit")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<RouteIcon size={18} />} label={t("fleet.totalTrips")} value={`${trips.length}`} hint={`${metrics.upcoming} ${t("fleet.upcomingTrips")}`} />
        <StatCard
          icon={<Users size={18} />}
          label={t("fleet.avgOccupancy")}
          value={metrics.occupancy != null ? `${metrics.occupancy.toFixed(0)}%` : "—"}
        />
        <StatCard
          icon={<Wallet size={18} />}
          label={t("fleet.revenueGenerated")}
          value={`CFA ${metrics.revenue.toFixed(2)}`}
        />
        <StatCard
          icon={<Wrench size={18} />}
          label={t("fleet.maintenanceCost")}
          value={`CFA ${maintenanceCost.toFixed(2)}`}
          hint={t("fleet.logsCount", { count: maintenance.length })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BusIcon size={18} className="text-primary" /> {t("fleet.vehicleInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label={t("fleet.busNumber")} value={bus.busNumber} />
            <InfoRow label={t("fleet.name")} value={bus.name} />
            <InfoRow label={t("fleet.make")} value={bus.make || t("common.na")} />
            <InfoRow label={t("fleet.model")} value={bus.model || t("common.na")} />
            <InfoRow label={t("fleet.year")} value={bus.year ?? t("common.na")} />
            <InfoRow label={t("fleet.color")} value={bus.color || t("common.na")} />
            <InfoRow label={t("fleet.plateNumber")} value={bus.plateNumber || t("common.na")} />
            <InfoRow label={t("fleet.vin")} value={bus.vin || t("common.na")} />
            <InfoRow label={t("fleet.fuelType")} value={bus.fuelType ? t(`fleet.fuel.${bus.fuelType}`, { defaultValue: bus.fuelType }) : t("common.na")} />
            <InfoRow label={t("fleet.odometer")} value={bus.odometer != null ? `${bus.odometer} km` : t("common.na")} />
            <InfoRow label={t("fleet.registrationNumber")} value={bus.registrationNumber || t("common.na")} />
            <InfoRow label={t("fleet.capacity")} value={bus.capacity} />
            <InfoRow label={t("fleet.type")} value={<Badge variant="outline">{bus.type}</Badge>} />
            <div className="pt-2">
              <p className="mb-1 text-sm text-muted-foreground">{t("fleet.amenities")}</p>
              {amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((f) => (
                    <Badge key={f} variant="secondary">
                      {t(`fleet.amenity.${f}`, { defaultValue: f })}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("fleet.noAmenities")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={18} className="text-primary" /> {t("fleet.assignedDriver")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driver && driverName ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold">{driverName}</p>
                {driver.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} /> <span>{driver.email}</span>
                  </div>
                )}
                {driver.profile?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} /> <span>{driver.profile.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("fleet.noDriver")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={18} className="text-primary" /> {t("fleet.busManager")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bus.busManager ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold">
                  {bus.busManager.profile?.firstName} {bus.busManager.profile?.lastName}
                </p>
                {bus.busManager.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} /> <span>{bus.busManager.email}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("fleet.noBusManager")}</p>
            )}
          </CardContent>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={18} className="text-primary" /> {t("fleet.maintenanceManager")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bus.maintenanceManager ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold">
                  {bus.maintenanceManager.profile?.firstName} {bus.maintenanceManager.profile?.lastName}
                </p>
                {bus.maintenanceManager.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} /> <span>{bus.maintenanceManager.email}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("fleet.noMaintenanceManager")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin size={18} className="text-primary" /> {t("fleet.liveLocation")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveLocation ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 pb-1">
                  <Badge variant={liveLocation.status === "on_trip" ? "success" : "secondary"}>
                    {liveLocation.status === "on_trip" ? t("fleet.onTrip") : t("fleet.idle")}
                  </Badge>
                </div>
                <InfoRow
                  label={t("fleet.speed")}
                  value={
                    <span className="flex items-center justify-end gap-1">
                      <Gauge size={14} /> {liveLocation.speed.toFixed(0)} km/h
                    </span>
                  }
                />
                <InfoRow
                  label={t("fleet.heading")}
                  value={
                    <span className="flex items-center justify-end gap-1">
                      <Compass size={14} /> {liveLocation.heading.toFixed(0)}°
                    </span>
                  }
                />
                <InfoRow
                  label={t("fleet.coordinates")}
                  value={
                    <span className="font-mono text-xs">
                      {liveLocation.latitude.toFixed(5)}, {liveLocation.longitude.toFixed(5)}
                    </span>
                  }
                />
                <InfoRow
                  label={t("fleet.lastUpdated")}
                  value={new Date(liveLocation.lastUpdated).toLocaleString()}
                />
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("fleet.notTracking")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck size={18} className="text-primary" /> {t("fleet.compliance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasCompliance ? (
              <>
                <ComplianceRow label={t("fleet.registrationExpiry")} iso={bus.registrationExpiry} />
                <ComplianceRow label={t("fleet.fitnessExpiry")} iso={bus.fitnessExpiry} />
                <InfoRow label={t("fleet.insuranceProvider")} value={bus.insuranceProvider || t("common.na")} />
                <InfoRow label={t("fleet.insurancePolicyNumber")} value={bus.insurancePolicyNumber || t("common.na")} />
                <InfoRow label={t("fleet.insuranceIssueDate")} value={bus.insuranceIssueDate ? new Date(bus.insuranceIssueDate).toLocaleDateString() : t("common.na")} />
                <ComplianceRow label={t("fleet.insuranceExpiry")} iso={bus.insuranceExpiry} />
                <ComplianceRow label={t("fleet.lastInspectionDate")} iso={bus.lastInspectionDate} />
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("fleet.noCompliance")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart size={18} className="text-primary" /> {t("fleet.purchaseInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasPurchase ? (
              <>
                <InfoRow label={t("fleet.purchaseDate")} value={bus.purchaseDate ? new Date(bus.purchaseDate).toLocaleDateString() : t("common.na")} />
                <InfoRow label={t("fleet.purchaseCost")} value={bus.purchaseCost != null ? `CFA ${bus.purchaseCost.toFixed(2)}` : t("common.na")} />
                <InfoRow label={t("fleet.homeDepot")} value={bus.homeDepot || t("common.na")} />
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("fleet.noPurchase")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock size={18} className="text-primary" /> {t("fleet.serviceInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label={t("fleet.firstServiceDate")} value={bus.firstServiceDate ? new Date(bus.firstServiceDate).toLocaleDateString() : t("common.na")} />
              <InfoRow label={t("fleet.matriculationDate")} value={bus.matriculationDate ? new Date(bus.matriculationDate).toLocaleDateString() : t("common.na")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {bus.photos && bus.photos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon size={18} className="text-primary" /> {t("fleet.photos")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {bus.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border">
                  <img
                    src={url}
                    alt={`${bus.busNumber} ${i + 1}`}
                    className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {bus.capacity > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Armchair size={18} className="text-primary" /> {t("fleet.seatLayout")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">{t("fleet.seatCount", { count: bus.capacity })}</p>
            <div className="inline-flex flex-col gap-2 overflow-x-auto rounded-lg border bg-muted/20 p-4">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {t("trips.front")}
              </p>
              {seatRows.map((row, ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <span className="w-4 text-center text-xs font-semibold text-muted-foreground">
                    {ROW_LETTERS[ri]}
                  </span>
                  {row.map((seat, ci) => (
                    <span
                      key={seat}
                      title={seat}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-md border bg-secondary text-[11px] font-medium text-foreground",
                        ci === 2 && "ml-5"
                      )}
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <RouteIcon size={18} className="text-primary" /> {t("fleet.tripHistory")}
          </CardTitle>
          <Badge variant="outline">{t("fleet.tripsCount", { count: trips.length })}</Badge>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={tripColumns}
            data={trips}
            isLoading={tripsLoading}
            onRowClick={(tr) => navigate(`/trips/${tr._id}`)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench size={18} className="text-primary" /> {t("fleet.maintenanceHistory")}
          </CardTitle>
          <div className="flex items-center gap-2">
                <Badge variant="secondary">{t("fleet.totalCost")}: CFA {maintenanceCost.toFixed(2)}</Badge>
            <Button size="sm" className="gap-1" onClick={() => { setMaintForm({ ...MAINTENANCE_EMPTY, date: new Date().toISOString().slice(0, 10) }); setIsMaintOpen(true); }}>
              <Plus size={14} /> {t("fleet.addMaintenance")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={maintenanceColumns} data={maintenance} isLoading={maintenanceLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">{t("fleet.createdAt")}:</span>
            <span className="font-medium">{new Date(bus.createdAt).toLocaleString()}</span>
          </div>
          {bus.updatedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarClock size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">{t("fleet.updatedAt")}:</span>
              <span className="font-medium">{new Date(bus.updatedAt).toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isMaintOpen} onClose={() => setIsMaintOpen(false)} title={t("fleet.addMaintenance")} className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form className="space-y-4" onSubmit={handleAddMaintenance}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.maintDate")}</label>
              <input required type="date" value={maintForm.date} onChange={e => setMaintForm({ ...maintForm, date: e.target.value })} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.maintType")}</label>
              <select value={maintForm.type} onChange={e => setMaintForm({ ...maintForm, type: e.target.value })} className="w-full p-2 border rounded-md bg-background">
                {["routine", "repair", "inspection", "other"].map(ty => (
                  <option key={ty} value={ty}>{t(`fleet.maint.${ty}`, { defaultValue: ty })}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.maintDescription")}</label>
            <textarea required value={maintForm.description} onChange={e => setMaintForm({ ...maintForm, description: e.target.value })} className="w-full p-2 border rounded-md" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.maintCost")}</label>
              <input type="number" min="0" value={maintForm.cost} onChange={e => setMaintForm({ ...maintForm, cost: e.target.value })} className="w-full p-2 border rounded-md" placeholder="CFA" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.odometer")}</label>
              <input type="number" value={maintForm.odometer} onChange={e => setMaintForm({ ...maintForm, odometer: e.target.value })} className="w-full p-2 border rounded-md" placeholder="km" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.maintBy")}</label>
              <input type="text" value={maintForm.performedBy} onChange={e => setMaintForm({ ...maintForm, performedBy: e.target.value })} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.nextServiceDate")}</label>
              <input type="date" value={maintForm.nextServiceDate} onChange={e => setMaintForm({ ...maintForm, nextServiceDate: e.target.value })} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("fleet.maintFacility")}</label>
              <select value={maintForm.facilityId} onChange={e => setMaintForm({ ...maintForm, facilityId: e.target.value })} className="w-full p-2 border rounded-md bg-background">
                <option value="">{t("fleet.maintNoFacility")}</option>
                {facilities.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsMaintOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={savingMaint}>{savingMaint ? t("common.loading") : t("fleet.addMaintenance")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BusDetailsPage;
