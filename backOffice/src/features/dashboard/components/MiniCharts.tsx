import React from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import type { DailyRevenue, BookingTrend } from "@/api/analyticsApi";

interface RevenueMiniChartProps {
  data: DailyRevenue[];
  loading?: boolean;
}

export const RevenueMiniChart: React.FC<RevenueMiniChartProps> = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) return <div className="h-24 bg-muted rounded animate-pulse" />;
  if (!data.length) return <p className="text-xs text-muted-foreground text-center py-6">{t("charts.noData")}</p>;

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.slice(-14)}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "11px" }}
            formatter={(v) => [`CFA ${v}`, t("charts.revenue")]}
          />
          <Area type="monotone" dataKey="dailyRevenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface BookingsMiniChartProps {
  data: BookingTrend[];
  loading?: boolean;
}

export const BookingsMiniChart: React.FC<BookingsMiniChartProps> = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) return <div className="h-24 bg-muted rounded animate-pulse" />;
  if (!data.length) return <p className="text-xs text-muted-foreground text-center py-6">{t("charts.noData")}</p>;

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(-14)}>
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "11px" }}
            formatter={(v) => [v, t("charts.bookings")]}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
