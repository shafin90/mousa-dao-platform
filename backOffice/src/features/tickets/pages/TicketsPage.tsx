import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTickets } from "../hooks/useTickets";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/modals/Modal";
import { Search, ShieldCheck, Eye, Shield, User, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ticketApi } from "@/api/ticketApi";
import { useAppSelector } from "@/app/store";
import type { TicketData } from "@/api/ticketApi";

const STATUS_VARIANTS: Record<string, "success"|"secondary"|"destructive"|"warning"> = {
  valid: "success", used: "secondary", expired: "warning",
};

const TicketsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tickets, loading, search, refresh } = useTickets();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [ticketNumber, setTicketNumber] = useState("");
  const [passengerSearch, setPassengerSearch] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [verifyingTicket, setVerifyingTicket] = useState(false);

  const handleVerify = async () => {
    if (!ticketNumber.trim()) return;
    setVerifying(true);
    try {
      const result = await ticketApi.verify(ticketNumber.trim());
      toast.success(t("tickets.verified", { status: result.status }));
      setTicketNumber("");
    } catch {
      toast.error(t("tickets.verifyFailed"));
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyTicket = async () => {
    if (!selectedTicket) return;
    setVerifyingTicket(true);
    try {
      const result = await ticketApi.verifyById(selectedTicket._id);
      setSelectedTicket(result);
      toast.success(t("tickets.verifiedSuccess"));
    } catch {
      toast.error(t("tickets.verifyFailed"));
    } finally {
      setVerifyingTicket(false);
    }
  };

  const columns = [
    { header: t("tickets.ticketNo"), accessor: (item: TicketData) => <span className="font-mono font-medium">{item.ticketNumber}</span> },
    { header: t("tickets.passenger"), accessor: (item: TicketData) => item.userId?.profile ? `${item.userId.profile.firstName} ${item.userId.profile.lastName}` : item.userId?.email || t("common.na") },
    { header: t("tickets.route"), accessor: (item: TicketData) => item.tripId?.routeId ? `${item.tripId.routeId.fromCity?.name || ''} → ${item.tripId.routeId.toCity?.name || ''}` : t("common.na") },
    { header: t("tickets.status"), accessor: (item: TicketData) => (
        <Badge variant={STATUS_VARIANTS[item.status] || "outline"}>{t(`tickets.${item.status}`, { defaultValue: item.status?.toUpperCase() })}</Badge>
    )},
    { header: t("tickets.actions"), accessor: (item: TicketData) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(item)}>
          <Eye size={14} className="mr-1" /> {t("tickets.viewDetails")}
        </Button>
    )},
  ];

  const handlePassengerSearch = (value: string) => {
    setPassengerSearch(value);
    if (value.length >= 2 || value.length === 0) {
      search(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tickets.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("tickets.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder={t("tickets.enterTicketNumber")}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            size="sm"
            className="gap-2 shrink-0"
            onClick={handleVerify}
            disabled={verifying || !ticketNumber.trim()}
          >
            <ShieldCheck size={16} /> {verifying ? t("tickets.verifying") : t("tickets.verify")}
          </Button>
        </div>
        <div className="relative flex-1 max-w-md">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={passengerSearch}
            onChange={(e) => handlePassengerSearch(e.target.value)}
            placeholder={t("tickets.searchPassenger")}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <DataTable columns={columns} data={tickets} isLoading={loading} />

      <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={t("tickets.details", { number: selectedTicket?.ticketNumber || '' })} className="max-w-lg">
        {selectedTicket && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t("tickets.passenger")}</p>
                <p className="font-medium">{selectedTicket.userId?.profile?.firstName} {selectedTicket.userId?.profile?.lastName}</p>
                <p className="text-xs text-muted-foreground">{selectedTicket.userId?.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("tickets.bookingCode")}</p>
                <p className="font-mono font-medium">{selectedTicket.bookingId?.bookingCode || t("common.na")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("tickets.route")}</p>
                <p className="font-medium">{selectedTicket.tripId?.routeId?.fromCity?.name || '?'} → {selectedTicket.tripId?.routeId?.toCity?.name || '?'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("tickets.date")}</p>
                <p className="font-medium">{selectedTicket.tripId?.date ? new Date(selectedTicket.tripId.date).toLocaleDateString() : t("common.na")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("tickets.departure")}</p>
                <p className="font-medium">{selectedTicket.tripId?.departureTime || t("common.na")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("tickets.status")}</p>
                <Badge variant={STATUS_VARIANTS[selectedTicket.status] || "outline"}>{t(`tickets.${selectedTicket.status}`, { defaultValue: selectedTicket.status?.toUpperCase() })}</Badge>
              </div>
              {selectedTicket.scannedAt && (
                <div>
                  <p className="text-muted-foreground text-xs">{t("tickets.scannedAt")}</p>
                  <p className="font-medium">{new Date(selectedTicket.scannedAt).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">{t("tickets.created")}</p>
                <p className="font-medium">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedTicket.qrCode && (
              <div className="flex justify-center">
                <img src={selectedTicket.qrCode} alt={t("tickets.qrCode")} className="w-32 h-32 border rounded-md" />
              </div>
            )}

            {currentUser?.role === 'admin' && selectedTicket.status === 'valid' && (
              <div className="pt-2 flex justify-end">
                <Button size="sm" className="gap-2" onClick={handleVerifyTicket} disabled={verifyingTicket}>
                  <Shield size={16} /> {verifyingTicket ? t("tickets.verifying") : t("tickets.verifyTicket")}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
export default TicketsPage;
