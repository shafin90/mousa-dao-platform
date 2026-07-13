import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import type { PeakTime } from "@/api/analyticsApi";

interface Props {
  data: PeakTime[];
}

export const PeakTimesChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chartData = data.map((t) => ({
    name: `${t._id}:00`,
    trips: t.tripCount,
    bookings: t.totalBookings,
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("analytics.peakTimes.title")}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">{t("charts.noData")}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("analytics.peakTimes.title")}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
              <Bar dataKey="bookings" fill="#f59e0b" barSize={28} radius={[4, 4, 0, 0]} name={t("charts.seatsBooked")} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
