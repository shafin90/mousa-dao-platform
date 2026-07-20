import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui/Badge";
import type { LiveTrip } from "@/api/analyticsApi";

interface Props {
  data: LiveTrip[];
  loading?: boolean;
  onRowClick?: (trip: LiveTrip) => void;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "default"> = {
  scheduled: "secondary",
  boarding: "warning",
  active: "success",
};

export const LiveTripsTable: React.FC<Props> = ({ data, loading, onRowClick }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{t("liveTrips.noActive")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
            <th className="pb-2 font-medium">{t("trips.route")}</th>
            <th className="pb-2 font-medium">{t("trips.bus")}</th>
            <th className="pb-2 font-medium">{t("trips.departure")}</th>
            <th className="pb-2 font-medium">{t("liveTrips.occupancy")}</th>
            <th className="pb-2 font-medium">{t("common.status")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((trip) => (
            <tr key={trip._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onRowClick?.(trip)}>
              <td className="py-2.5 pr-4">{trip.route}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{trip.bus}</td>
              <td className="py-2.5 pr-4 font-mono text-xs">{trip.departureTime}</td>
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(trip.occupancyRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{trip.occupancyRate}%</span>
                </div>
              </td>
              <td className="py-2.5">
                <Badge variant={STATUS_VARIANT[trip.status] || "outline"} className="capitalize">
                  {trip.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
