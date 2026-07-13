import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Bus, Wrench, CalendarClock, AlertTriangle, ShieldAlert, Wallet, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/Button";
import { StatsCard } from "@/features/dashboard/components/StatsCard";
import { maintenanceDashboardApi, type MaintenanceDashboardData } from "@/api/maintenanceDashboardApi";

const MaintenanceDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<MaintenanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const overview = await maintenanceDashboardApi.getOverview();
      setData(overview);
    } catch {
      toast.error(t("maintenance.dashboard.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tiles = [
    { key: "totalBuses", icon: Bus, value: data?.totalBuses ?? 0 },
    { key: "busesUnderMaintenance", icon: Wrench, value: data?.busesUnderMaintenance ?? 0 },
    { key: "upcomingMaintenance", icon: CalendarClock, value: data?.upcomingMaintenance ?? 0 },
    { key: "overdueMaintenance", icon: AlertTriangle, value: data?.overdueMaintenance ?? 0 },
    { key: "breakdownToday", icon: ShieldAlert, value: data?.breakdownToday ?? 0 },
    { key: "maintenanceCostThisMonth", icon: Wallet, value: `CFA ${(data?.maintenanceCostThisMonth ?? 0).toLocaleString()}` },
    { key: "vehiclesOutOfService", icon: Ban, value: data?.vehiclesOutOfService ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{t("maintenance.dashboard.title")}</h2>
        <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}>
          <RefreshCw size={16} /> {t("common.refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <StatsCard
            key={tile.key}
            title={t(`maintenance.dashboard.${tile.key}`)}
            value={tile.value}
            icon={tile.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default MaintenanceDashboardPage;
