import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { MonthlyRevenue } from "@/api/analyticsApi";

interface Props {
  data: MonthlyRevenue[];
}

export const MonthlyRevenueChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  if (!data.length) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("analytics.revenue.monthly")}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">{t("charts.noData")}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("analytics.revenue.monthly")}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `CFA ${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => [`CFA ${value}`, t("charts.revenue")]}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" barSize={40} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
