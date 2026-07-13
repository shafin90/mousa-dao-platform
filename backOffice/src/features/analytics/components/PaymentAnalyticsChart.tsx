import React from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/shared/components/ui/Card";
import type { PaymentAnalyticsData } from "@/api/analyticsApi";

interface Props {
  data: PaymentAnalyticsData;
  loading?: boolean;
}

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1", "#ec4899"];

export const PaymentAnalyticsChart: React.FC<Props> = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) return <div className="h-72 bg-muted rounded-xl animate-pulse" />;

  const methodData = data.paymentMethodDistribution.map((m) => ({
    name: m._id || t("common.unknown"),
    value: m.count,
    total: m.total,
  }));

  return (
    <Card>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={methodData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {methodData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v, n) => [v, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-sm font-medium">{t("analytics.payments.successRate")}</span>
              <span className="text-lg font-bold text-emerald-600">{data.successRate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("analytics.payments.totalPayments")}</span>
              <span className="font-medium">{data.totalPayments}</span>
            </div>
            {Object.entries(data.statusSummary).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {methodData.map((m, i) => (
              <div key={m.name} className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="flex-1 capitalize text-muted-foreground">{m.name.replace(/_/g, " ")}</span>
                <span className="font-medium">{m.value}</span>
                <span className="text-xs text-muted-foreground">(${(m.total || 0).toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
