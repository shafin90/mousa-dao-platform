import React from "react";
import { useTranslation } from "react-i18next";
import { Users, UserPlus, Repeat, TrendingUp } from "lucide-react";
import type { CustomerMetrics } from "@/api/analyticsApi";

interface Props {
  data: CustomerMetrics;
  loading?: boolean;
}

export const CustomerAnalytics: React.FC<Props> = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
      </div>
    );
  }

  const cards = [
    { label: t("analytics.customers.total"), value: data.totalCustomers, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: t("analytics.customers.newThisMonth"), value: data.newCustomersThisMonth, icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: t("analytics.customers.repeat"), value: data.repeatCustomers, icon: Repeat, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: t("analytics.customers.growthRate"), value: `${data.customerGrowthRate}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${c.bg}`}>
              <c.icon size={18} className={c.color} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold">{c.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
