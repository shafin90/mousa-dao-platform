import React from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { UserRoleCount } from "@/api/analyticsApi";

const ROLE_COLORS: Record<string, string> = {
  admin: "#8b5cf6",
  staff: "#3b82f6",
  driver: "#f59e0b",
  customer: "#10b981",
  passenger: "#10b981",
};

interface Props {
  data: UserRoleCount[];
}

export const UserRolesChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chartData = data.map((r) => ({
    name: r._id.charAt(0).toUpperCase() + r._id.slice(1),
    value: r.count,
    color: ROLE_COLORS[r._id] || "#6b7280",
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("analytics.users.title")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("users.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("analytics.users.title")}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
