import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { CancellationStats } from "@/api/analyticsApi";

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16"];

interface Props {
  data: CancellationStats;
}

export const CancellationChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chartData = data.byRoute.map((r, i) => ({
    name: `${r.fromStationName || "?"} → ${r.toStationName || "?"}`.length > 25
      ? `${(r.fromStationName || "?").slice(0, 12)}…`
      : `${r.fromStationName || "?"} → ${r.toStationName || "?"}`,
    rate: r.rate,
    cancelled: r.cancelled,
    total: r.total,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader><CardTitle>{t("charts.cancellationAnalysis")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-3 text-center">
            <p className="text-2xl font-bold text-rose-600">{data.cancellationRate}%</p>
            <p className="text-xs text-muted-foreground">{t("analytics.cancellationRate")}</p>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{data.cancelledBookings}</p>
            <p className="text-xs text-muted-foreground">{t("charts.cancelled")}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{data.totalBookings}</p>
            <p className="text-xs text-muted-foreground">{t("charts.totalBookings")}</p>
          </div>
        </div>
        {chartData.length > 0 && (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }}
                  formatter={(value) => [`${value}%`, t("analytics.cancellationRate")]}
                />
                <Bar dataKey="rate" barSize={16} radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
