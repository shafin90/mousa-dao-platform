import React from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { TripOccupancy } from "@/api/analyticsApi";

interface Props {
  data: TripOccupancy[];
}

export const OccupancyChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chartData = data.map((t, idx) => ({
    name: `Trip ${idx + 1}`,
    occupancy: Math.round(t.occupancyRate * 10) / 10,
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("charts.occupancy")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("trips.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("charts.occupancy")}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value) => [`${value}%`, t("charts.occupancy")]}
              />
              <Bar dataKey="occupancy" fill="hsl(var(--primary))" barSize={24} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
