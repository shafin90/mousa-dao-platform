import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { RefreshCw, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import type { PaymentData, RefundRequestData } from "@/api/paymentApi";
import { usePayments } from "../hooks/usePayments";
import { RefundRequestDetailModal } from "../components/RefundRequestDetailModal";

type Tab = "all" | "pending" | "completed" | "issues" | "refunds";

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All Payments" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "issues", label: "Issues" },
  { key: "refunds", label: "Refund Requests" },
];

const statusQuery: Record<Tab, string | undefined> = {
  all: undefined,
  pending: "pending,processing",
  completed: "success",
  issues: "failed,refunded",
  refunds: undefined,
};

const paymentStatusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  success: "success", pending: "warning", processing: "warning", failed: "destructive", refunded: "secondary", expired: "destructive",
};

const refundStatusVariant: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  pending: "warning", approved: "success", rejected: "destructive",
};

const PaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const {
    payments, paymentsLoading, refunds, refundsLoading,
    fetchPayments, fetchRefunds, approveRefund, rejectRefund,
  } = usePayments();

  const [selectedRefund, setSelectedRefund] = useState<RefundRequestData | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === "refunds") {
      fetchRefunds();
    } else {
      fetchPayments({ status: statusQuery[activeTab] });
    }
  }, [activeTab, fetchPayments, fetchRefunds]);

  const handleApprove = useCallback(async (id: string) => {
    try {
      await approveRefund(id).unwrap();
      toast.success("Refund request approved");
    } catch {
      toast.error("Failed to approve refund request");
    }
  }, [approveRefund]);

  const handleReject = useCallback(async (id: string) => {
    try {
      await rejectRefund(id).unwrap();
      toast.success("Refund request rejected");
    } catch {
      toast.error("Failed to reject refund request");
    }
  }, [rejectRefund]);

  const payColumns = [
    { header: t("payments.txRef"), accessor: (item: PaymentData) => <span className="font-mono text-xs">{item.tx_ref}</span> },
    { header: t("payments.customer"), accessor: (item: PaymentData) => (
        <div>
          <p className="font-medium">{item.userId?.profile?.firstName} {item.userId?.profile?.lastName}</p>
          <p className="text-xs text-muted-foreground">{item.userId?.email}</p>
        </div>
      )
    },
    { header: "Booking", accessor: (item: PaymentData) => <span className="font-mono text-xs">{item.bookingId?.bookingCode}</span> },
    { header: "Amount", accessor: (item: PaymentData) => <span className="font-medium">CFA ${(item.amount || 0).toFixed(2)}</span> },
    { header: t("payments.status"), accessor: (item: PaymentData) => (
        <Badge variant={paymentStatusVariant[item.status] || "outline"}>{t(`payments.${item.status}`, { defaultValue: item.status?.toUpperCase() })}</Badge>
    )},
    { header: t("payments.date"), accessor: (item: PaymentData) => new Date(item.createdAt).toLocaleDateString() },
  ];

  const refundColumns = [
    { header: "Request ID", accessor: (item: RefundRequestData) => <span className="font-mono text-xs font-medium">{item.requestId}</span> },
    { header: "Booking Code", accessor: (item: RefundRequestData) => <span className="font-mono text-xs">{item.bookingId?.bookingCode}</span> },
    { header: "User", accessor: (item: RefundRequestData) => (
        <div>
          <p className="font-medium text-sm">{item.userId?.profile?.firstName} {item.userId?.profile?.lastName}</p>
          <p className="text-xs text-muted-foreground">{item.userId?.email}</p>
        </div>
      )
    },
    { header: "Amount", accessor: (item: RefundRequestData) => <span className="font-medium">CFA ${(item.amount || 0).toFixed(2)}</span> },
    { header: "Status", accessor: (item: RefundRequestData) => (
        <Badge variant={refundStatusVariant[item.status] || "outline"}>{item.status.toUpperCase()}</Badge>
    )},
    { header: "Requested At", accessor: (item: RefundRequestData) => new Date(item.createdAt).toLocaleDateString() },
    {
      header: "Action",
      accessor: (item: RefundRequestData) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedRefund(item); setRefundModalOpen(true); }}>
            <Eye size={16} />
          </Button>
          {item.status === "pending" && (
            <>
              <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApprove(item._id)} title="Approve">
                <Check size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleReject(item._id)} title="Reject">
                <X size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const loading = activeTab === "refunds" ? refundsLoading : paymentsLoading;
  const data = activeTab === "refunds" ? refunds : payments;
  const columns = activeTab === "refunds" ? refundColumns : payColumns;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("payments.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("payments.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => activeTab === "refunds" ? fetchRefunds() : fetchPayments({ status: statusQuery[activeTab] })}>
          <RefreshCw size={16} /> {t("common.refresh")}
        </Button>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable columns={columns as any} data={data as any} isLoading={loading} />
      <RefundRequestDetailModal refund={selectedRefund} isOpen={refundModalOpen} onClose={() => { setRefundModalOpen(false); setSelectedRefund(null); }} />
    </div>
  );
};
export default PaymentsPage;
