import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Clock, MapPin, Bus, User, CreditCard, Ticket, Shield, Wallet, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { bookingApi, type BookingData } from "@/api/bookingApi";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  confirmed: "success", pending: "warning", cancelled: "destructive",
};

const paymentVariant: Record<string, "success" | "warning" | "destructive"> = {
  paid: "success", unpaid: "warning", refunded: "destructive",
};

const DetailRow: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 p-1.5 rounded-md bg-muted/50 text-muted-foreground">
      <Icon size={16} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  </div>
);

const BookingDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await bookingApi.getById(id);
        if (!active) return;
        if (!data) { setNotFound(true); return; }
        setBooking(data);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/bookings")}>
          <ArrowLeft size={16} /> {t("bookings.backToBookings")}
        </Button>
        <Card><CardContent className="p-10 text-center text-muted-foreground">{t("bookings.notFound")}</CardContent></Card>
      </div>
    );
  }

  const { userId, tripId, seats, bookingCode, totalAmount, status, paymentStatus, createdAt } = booking;
  const route = tripId?.routeId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/bookings")}>
            <ArrowLeft size={16} /> {t("bookings.backToBookings")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Tag size={22} className="text-primary" />
            <span className="font-mono">{bookingCode}</span>
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{booking._id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[status] || "outline"} className="text-sm px-3 py-1">
            {t(`bookings.${status}`, { defaultValue: status?.toUpperCase() })}
          </Badge>
          <Badge variant={paymentVariant[paymentStatus] || "warning"} className="text-sm px-3 py-1">
            {paymentStatus?.toUpperCase() || t("bookings.unpaid")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={16} /> {t("bookings.customer")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={User} label={t("users.name")} value={`${userId?.profile?.firstName || ""} ${userId?.profile?.lastName || ""}`.trim() || "—"} />
            <DetailRow icon={Shield} label={t("users.email")} value={userId?.email || "—"} />
            <DetailRow icon={CreditCard} label={t("users.phoneLabel")} value={userId?.phone || "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar size={16} /> {t("trips.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={Calendar} label={t("trips.date")} value={tripId?.date ? new Date(tripId.date).toLocaleDateString() : "—"} />
            <DetailRow icon={Clock} label={t("trips.departure")} value={tripId?.departureTime || "—"} />
            <DetailRow icon={Clock} label={t("trips.arrival")} value={tripId?.arrivalTime || "—"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin size={16} /> {t("routes.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              icon={MapPin}
              label={`${t("routes.from")} → ${t("routes.to")}`}
              value={route ? `${route.fromCity?.name || "?"} → ${route.toCity?.name || "?"}` : "—"}
            />
            <DetailRow icon={Bus} label={t("trips.bus")} value={tripId?.busId?.busNumber || "—"} />
            <DetailRow icon={Ticket} label={t("bookings.seats")} value={Array.isArray(seats) ? seats.join(", ") : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet size={16} /> {t("payments.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              icon={Wallet}
              label={t("bookings.amount")}
              value={<span className="text-lg font-bold">CFA {(totalAmount || 0).toFixed(2)}</span>}
            />
            <DetailRow
              icon={Calendar}
              label={t("bookings.bookedOn")}
              value={createdAt ? new Date(createdAt).toLocaleString() : "—"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
