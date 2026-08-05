import React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/modals/Modal";
import { Badge } from "@/shared/components/ui/Badge";
import { Calendar, Clock, MapPin, Bus, User, CreditCard, Ticket, Wallet } from "lucide-react";
import type { BookingData } from "@/api/bookingApi";

interface Props {
  booking: BookingData | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  confirmed: "success", pending: "warning", cancelled: "destructive",
};

const paymentVariant: Record<string, "success" | "warning" | "destructive"> = {
  paid: "success", unpaid: "warning", refunded: "destructive",
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
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
}

export const BookingDetailModal: React.FC<Props> = ({ booking, isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!booking) return null;

  const { userId, tripId, seats, passengers, bookingCode, totalAmount, status, paymentStatus, createdAt } = booking;
  const route = tripId?.routeId;

  const primaryPassenger = passengers && passengers.length > 0 ? passengers[0] : null;
  const primaryName = primaryPassenger?.name
    || `${userId?.profile?.firstName || ""} ${userId?.profile?.lastName || ""}`.trim()
    || "—";
  const primaryPhone = primaryPassenger?.phone || userId?.phone || "—";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t("bookings.title")} ${bookingCode}`} className="max-w-2xl">
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusVariant[status] || "outline"}>{status.toUpperCase()}</Badge>
          <Badge variant={paymentVariant[paymentStatus] || "warning"}>
            {paymentStatus?.toUpperCase() || t("bookings.unpaid")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("bookings.customer")}</h3>
            <DetailRow icon={User} label={t("users.name")} value={primaryName} />
            <DetailRow icon={CreditCard} label={t("users.phoneLabel")} value={primaryPhone} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("trips.title")}</h3>
            <DetailRow icon={Calendar} label={t("trips.date")} value={tripId?.date ? new Date(tripId.date).toLocaleDateString() : "—"} />
            <DetailRow icon={Clock} label={t("trips.departure")} value={tripId?.departureTime || "—"} />
            <DetailRow icon={Clock} label={t("trips.arrival")} value={tripId?.arrivalTime || "—"} />
          </div>
        </div>

        {passengers && passengers.length > 0 && (
          <>
            <hr className="border-t" />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("passenger.passengers") || "Passengers"} ({passengers.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {passengers.map((p, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{p.name || "—"}</p>
                      <Badge variant="outline" className="text-xs font-mono">{p.seat}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard size={12} /> {p.phone || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <hr className="border-t" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("routes.title")}</h3>
            <DetailRow
              icon={MapPin}
              label={t("routes.from") + " → " + t("routes.to")}
              value={
                route
                  ? `${route.fromCity?.name || "?"} → ${route.toCity?.name || "?"}`
                  : "—"
              }
            />
            <DetailRow icon={Bus} label={t("trips.bus")} value={tripId?.busId?.busNumber || "—"} />
            <DetailRow icon={Ticket} label={t("bookings.seats")} value={Array.isArray(seats) ? seats.join(", ") : "—"} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("payments.title")}</h3>
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
          </div>
        </div>
      </div>

    </Modal>
  );
};
