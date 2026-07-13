import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBookings } from "../hooks/useBookings";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { RefreshCw, Eye, Search, X } from "lucide-react";
import type { BookingData, BookingFilters } from "@/api/bookingApi";
import { BookingDetailModal } from "../components/BookingDetailModal";

const statusOptions = ["", "confirmed", "pending", "cancelled"];
const paymentOptions = ["", "paid", "unpaid", "refunded"];

const BookingsPage: React.FC = () => {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const filters = useMemo<BookingFilters>(() => {
    const f: BookingFilters = {};
    if (search) f.search = search;
    if (status) f.status = status;
    if (paymentStatus) f.paymentStatus = paymentStatus;
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (amountMin) f.amountMin = Number(amountMin);
    if (amountMax) f.amountMax = Number(amountMax);
    return f;
  }, [search, status, paymentStatus, dateFrom, dateTo, amountMin, amountMax]);

  const { bookings, loading, refresh } = useBookings(filters);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDetails = (item: BookingData) => {
    setSelectedBooking(item);
    setModalOpen(true);
  };

  const closeDetails = () => {
    setModalOpen(false);
    setSelectedBooking(null);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const hasFilters = search || status || paymentStatus || dateFrom || dateTo || amountMin || amountMax;

  const columns = [
    { header: t("bookings.bookingCode"), accessor: (item: BookingData) => <span className="font-mono font-medium">{item.bookingCode || item._id?.slice(-6).toUpperCase()}</span> },
    { header: t("bookings.customer"), accessor: (item: BookingData) => (
        <div>
          <p className="font-medium">{item.userId?.profile?.firstName} {item.userId?.profile?.lastName}</p>
          <p className="text-xs text-muted-foreground">{item.userId?.email}</p>
        </div>
      )
    },
    { header: t("bookings.route"), accessor: (item: BookingData) => item.tripId?.routeId ? `${item.tripId.routeId.fromStation?.name || ''} → ${item.tripId.routeId.toStation?.name || ''}` : t("common.na") },
    { header: t("bookings.seats"), accessor: (item: BookingData) => Array.isArray(item.seats) ? item.seats.join(', ') : t("common.na") },
    { header: t("bookings.amount"), accessor: (item: BookingData) => <span className="font-medium">CFA ${(item.totalAmount || 0).toFixed(2)}</span> },
    { header: t("bookings.status"), accessor: (item: BookingData) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
          confirmed: "success", pending: "warning", cancelled: "destructive"
        };
        return <Badge variant={variants[item.status] || "outline"}>{t(`bookings.${item.status}`, { defaultValue: item.status?.toUpperCase() })}</Badge>;
      }
    },
    { header: t("bookings.payment"), accessor: (item: BookingData) => {
        const variants: Record<string, "success"|"warning"|"destructive"> = { paid: "success", unpaid: "warning", refunded: "destructive" };
        return <Badge variant={variants[item.paymentStatus] || "warning"}>{item.paymentStatus?.toUpperCase() || t("bookings.unpaid")}</Badge>;
      }
    },
    {
      header: t("bookings.actions"),
      accessor: (item: BookingData) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetails(item); }}>
          <Eye size={16} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("bookings.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("bookings.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
          <RefreshCw size={16} /> {t("common.refresh")}
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={`${t("common.search")} ${t("bookings.bookingCode")} / email...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 min-w-[130px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("bookings.allStatus") || "All Status"}</option>
            {statusOptions.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="h-9 min-w-[130px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("bookings.allPayment") || "All Payment"}</option>
            {paymentOptions.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Min $"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            className="h-9 w-[100px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Max $"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            className="h-9 w-[100px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} className="mr-1" /> {t("common.clear")}
            </Button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={bookings} isLoading={loading} />
      <BookingDetailModal booking={selectedBooking} isOpen={modalOpen} onClose={closeDetails} />
    </div>
  );
};
export default BookingsPage;
