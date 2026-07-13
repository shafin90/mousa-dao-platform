import React from "react";
import { Modal } from "@/shared/components/modals/Modal";
import { Badge } from "@/shared/components/ui/Badge";
import { User, FileText, DollarSign, Clock, CheckCircle, XCircle, MessageSquare, Hash, BookOpen } from "lucide-react";
import type { RefundRequestData } from "@/api/paymentApi";

interface Props {
  refund: RefundRequestData | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  pending: "warning", approved: "success", rejected: "destructive",
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

export const RefundRequestDetailModal: React.FC<Props> = ({ refund, isOpen, onClose }) => {
  if (!refund) return null;

  const { userId, bookingId, amount, reason, status, requestId, adminNote, reviewedBy, reviewedAt, createdAt } = refund;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Refund Request ${requestId}`} className="max-w-lg">
      <div className="space-y-5">
        <div>
          <Badge variant={statusVariant[status] || "outline"}>{status.toUpperCase()}</Badge>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Request Info</h3>
          <DetailRow icon={Hash} label="Request ID" value={<span className="font-mono">{requestId}</span>} />
          <DetailRow icon={BookOpen} label="Booking Code" value={<span className="font-mono">{bookingId?.bookingCode}</span>} />
          <DetailRow icon={DollarSign} label="Amount" value={<span className="text-lg font-bold">CFA {(amount || 0).toFixed(2)}</span>} />
          <DetailRow icon={Clock} label="Requested At" value={createdAt ? new Date(createdAt).toLocaleString() : "—"} />
        </div>

        <hr className="border-t" />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer</h3>
          <DetailRow icon={User} label="Name" value={`${userId?.profile?.firstName || ""} ${userId?.profile?.lastName || ""}`} />
          <DetailRow icon={FileText} label="Email" value={userId?.email || "—"} />
        </div>

        <hr className="border-t" />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Reason</h3>
          <DetailRow icon={MessageSquare} label="Reason" value={reason} />
        </div>

        {reviewedBy && (
          <>
            <hr className="border-t" />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Review</h3>
              <DetailRow
                icon={status === "approved" ? CheckCircle : XCircle}
                label="Reviewed By"
                value={`${reviewedBy.profile?.firstName || ""} ${reviewedBy.profile?.lastName || ""} (${reviewedBy.email})`}
              />
              <DetailRow icon={Clock} label="Reviewed At" value={reviewedAt ? new Date(reviewedAt).toLocaleString() : "—"} />
              {adminNote && <DetailRow icon={MessageSquare} label="Admin Note" value={adminNote} />}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
