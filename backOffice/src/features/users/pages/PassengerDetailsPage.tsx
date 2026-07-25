import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  LayoutDashboard,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { DataTable } from "@/shared/components/tables/DataTable";
import { userApi } from "@/api/userApi";
import { bookingApi, type BookingData } from "@/api/bookingApi";
import type { User } from "@/shared/types";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: CalendarClock },
] as const;

const bookingStatusVariant = (status: string) => {
  switch (status) {
    case "confirmed": return "success" as const;
    case "cancelled": return "destructive" as const;
    default: return "warning" as const;
  }
};

const paymentVariant = (status: string) => {
  switch (status) {
    case "paid": return "success" as const;
    case "refunded": return "secondary" as const;
    default: return "warning" as const;
  }
};

const PassengerDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const userData = await userApi.getById(id);
        if (!active) return;
        if (!userData) {
          setNotFound(true);
          return;
        }
        setUser(userData);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      setBookingsLoading(true);
      try {
        const res = await bookingApi.getAll({ limit: 200 });
        const userBookings = res.bookings.filter((b) => {
          const uid = typeof b.userId === "string" ? b.userId : b.userId?._id;
          return uid === id;
        });
        if (active) setBookings(userBookings);
      } catch {
        if (active) setBookings([]);
      } finally {
        if (active) setBookingsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const bookingColumns = [
    {
      header: t("bookings.bookingCode"),
      accessor: (b: BookingData) => <span className="font-mono text-xs">{b.bookingCode || "—"}</span>,
    },
    {
      header: t("trips.route"),
      accessor: (b: BookingData) =>
        b.tripId?.routeId
          ? `${b.tripId.routeId.fromCity?.name || "?"} → ${b.tripId.routeId.toCity?.name || "?"}`
          : t("common.na"),
    },
    {
      header: t("trips.date"),
      accessor: (b: BookingData) => b.tripId?.date ? new Date(b.tripId.date).toLocaleDateString() : "—",
    },
    {
      header: t("trips.seatsLabel"),
      accessor: (b: BookingData) => b.seats?.length ? b.seats.join(", ") : "—",
    },
    {
      header: t("trips.amount"),
      accessor: (b: BookingData) => <span className="font-medium">CFA {b.totalAmount?.toFixed(2) ?? "0.00"}</span>,
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

  if (notFound || !user) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/passengers")}>
          <ArrowLeft size={16} /> {t("users.backToUsers")}
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">{t("users.notFound")}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/passengers")}>
            <ArrowLeft size={16} /> {t("users.backToUsers")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UserIcon size={22} className="text-primary" />
            <span>{user.profile?.firstName} {user.profile?.lastName}</span>
            <Badge variant="outline" className="capitalize">{user.role}</Badge>
            <Badge variant={user.authTracking?.isLocked ? "destructive" : "success"}>
              {user.authTracking?.isLocked ? t("users.locked") : t("users.active")}
            </Badge>
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{user._id}</p>
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-1 overflow-x-auto border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeSection === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeSection === "overview" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserIcon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.name")}</p>
                  <p className="truncate text-lg font-semibold">{user.profile?.firstName} {user.profile?.lastName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.email")}</p>
                  <p className="truncate text-lg font-semibold">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.phone")}</p>
                  <p className="truncate text-lg font-semibold">{user.phone || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.role")}</p>
                  <p className="truncate text-lg font-semibold capitalize">{user.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.status")}</p>
                  <Badge variant={user.authTracking?.isLocked ? "destructive" : "success"}>
                    {user.authTracking?.isLocked ? t("users.locked") : t("users.active")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "bookings" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock size={18} className="text-primary" /> {t("trips.passengerManifest")}
            </CardTitle>
            <Badge variant="outline">{t("trips.totalBookings", { count: bookings.length })}</Badge>
          </CardHeader>
          <CardContent>
            <DataTable columns={bookingColumns} data={bookings} isLoading={bookingsLoading} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PassengerDetailsPage;