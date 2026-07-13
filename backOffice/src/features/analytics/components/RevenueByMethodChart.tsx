import React from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { RevenueByMethod } from "@/api/analyticsApi";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

interface Props {
  data: RevenueByMethod[];
}

export const RevenueByMethodChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chartData = data.map((d, i) => ({
    name: d._id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: d.total,
    count: d.count,
    color: COLORS[i % COLORS.length],
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("analytics.revenue.byMethod")}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">{t("charts.noData")}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("analytics.revenue.byMethod")}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
