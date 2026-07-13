import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui/Badge";
import type { RecentBookingItem } from "@/api/analyticsApi";

interface Props {
  data: RecentBookingItem[];
  loading?: boolean;
}

const PAYMENT_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  paid: "success",
  unpaid: "warning",
  refunded: "destructive",
};

const STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive"> = {
  confirmed: "success",
  pending: "secondary",
  cancelled: "destructive",
};

export const RecentBookings: React.FC<Props> = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{t("recentBookings.none")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
            <th className="pb-2 font-medium">{t("bookings.customer")}</th>
            <th className="pb-2 font-medium">{t("bookings.route")}</th>
            <th className="pb-2 font-medium">{t("bookings.seats")}</th>
            <th className="pb-2 font-medium">{t("bookings.amount")}</th>
            <th className="pb-2 font-medium">{t("bookings.payment")}</th>
            <th className="pb-2 font-medium">{t("bookings.status")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b) => (
            <tr key={b._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-2.5 pr-4">{b.customer}</td>
              <td className="py-2.5 pr-4 text-muted-foreground text-xs">{b.route}</td>
              <td className="py-2.5 pr-4">{b.seats}</td>
              <td className="py-2.5 pr-4 font-medium">CFA ${(b.totalAmount || 0).toLocaleString()}</td>
              <td className="py-2.5 pr-4">
                <Badge variant={PAYMENT_VARIANT[b.paymentStatus] || "outline"} className="capitalize text-xs">
                  {b.paymentStatus}
                </Badge>
              </td>
              <td className="py-2.5">
                <Badge variant={STATUS_VARIANT[b.status] || "outline"} className="capitalize text-xs">
                  {b.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
