import React from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { TopRoute } from "@/api/analyticsApi";

interface Props {
  data: TopRoute[];
}

const COLORS = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export const TopRoutesChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chartData = data.map((r, idx) => ({
    name: r.route?.[0]
      ? `${r.route[0].fromStation || ""} → ${r.route[0].toStation || ""}`
      : t("routes.fallbackLabel", { id: r._id.slice(-4) }),
    bookings: r.count,
    fill: COLORS[idx % COLORS.length],
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("routes.topRoutes")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("routes.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("routes.topRoutes")}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="bookings" barSize={20} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
