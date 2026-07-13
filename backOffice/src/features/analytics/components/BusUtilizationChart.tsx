import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { BusUtilization } from "@/api/analyticsApi";

interface Props {
  data: BusUtilization[];
}

export const BusUtilizationChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chartData = data.map((b) => ({
    name: b.busNumber,
    occupancy: b.avgOccupancy,
    trips: b.totalTrips,
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("busUtilization")}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">{t("charts.noData")}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("busUtilization")}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => [`${value}%`, t("charts.avgOccupancy")]}
              />
              <Bar dataKey="occupancy" fill="#8b5cf6" barSize={32} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
