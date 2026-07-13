import React from "react";
import { useTranslation } from "react-i18next";
import type { PaymentSummaryData } from "@/api/analyticsApi";

interface Props {
  data: PaymentSummaryData | null;
  loading?: boolean;
}

export const PaymentOverview: React.FC<Props> = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const items = [
    { label: t("paymentOverview.successful"), value: data.successful, color: "bg-emerald-500", textColor: "text-emerald-600" },
    { label: t("paymentOverview.failed"), value: data.failed, color: "bg-red-500", textColor: "text-red-600" },
    { label: t("paymentOverview.pending"), value: data.pending, color: "bg-amber-500", textColor: "text-amber-600" },
  ];

  const max = Math.max(data.successful, data.failed, data.pending, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{data.successRate}%</span>
        <span className="text-xs text-muted-foreground">{t("paymentOverview.successRate")}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <div
          className="bg-emerald-500 h-full transition-all"
          style={{ width: `${(data.successful / data.total) * 100}%` }}
        />
        <div
          className="bg-red-500 h-full transition-all"
          style={{ width: `${(data.failed / data.total) * 100}%` }}
        />
        <div
          className="bg-amber-500 h-full transition-all"
          style={{ width: `${(data.pending / data.total) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="flex-1 text-sm">{item.label}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            <span className={`text-sm font-medium w-12 text-right ${item.textColor}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
