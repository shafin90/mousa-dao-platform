import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { RoutePerformance } from "@/api/analyticsApi";

const COLORS = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

interface Props {
  data: RoutePerformance[];
}

export const RoutePerformanceChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chartData = data.map((r, i) => ({
    name: `${r.fromStationName || "?"} → ${r.toStationName || "?"}`,
    revenue: r.totalRevenue,
    bookings: r.bookings,
    fill: COLORS[i % COLORS.length],
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("routePerformance")}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">{t("charts.noData")}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("routePerformance")}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} tickFormatter={(v: number) => `CFA ${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={160} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => [`CFA ${value}`, t("charts.revenue")]}
              />
              <Bar dataKey="revenue" barSize={18} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
