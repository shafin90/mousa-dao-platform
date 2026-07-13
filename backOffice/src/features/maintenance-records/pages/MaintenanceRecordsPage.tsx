import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { maintenanceRecordApi, type MaintenanceRecord } from "@/api/maintenanceRecordApi";
import { maintenanceFacilityApi, type MaintenanceFacilityData } from "@/api/maintenanceFacilityApi";
import { busApi, type BusData } from "@/api/busApi";

const busLabelOf = (value: MaintenanceRecord["busId"]): string => {
  if (value && typeof value === "object") return value.busNumber || value.name || "—";
  return "—";
};

const facilityNameOf = (value: MaintenanceRecord["facilityId"]): string => {
  if (value && typeof value === "object" && "name" in value) return value.name;
  return "";
};

const busSelectLabel = (b: BusData): string => {
  const number = b.busNumber ? b.busNumber : "";
  const name = b.name ? b.name : "";
  if (number && name && number !== name) return `${number} · ${name}`;
  return number || name || b._id;
};

const MaintenanceRecordsPage: React.FC = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [facilities, setFacilities] = useState<MaintenanceFacilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busId, setBusId] = useState("");
  const [facilityId, setFacilityId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await maintenanceRecordApi.getAll({
        busId: busId || undefined,
        facilityId: facilityId || undefined,
      });
      setRecords(data);
    } catch {
      toast.error(t("maintenanceRecords.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const [busData, facilityData] = await Promise.all([
        busApi.getAll({ limit: 1000 }).catch(() => ({ buses: [] as BusData[], total: 0 })),
        maintenanceFacilityApi.getAll().catch(() => [] as MaintenanceFacilityData[]),
      ]);
      setBuses(busData.buses);
      setFacilities(facilityData);
    })();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId, facilityId]);

  const columns = [
    { header: t("maintenanceRecords.date"), accessor: (r: MaintenanceRecord) => new Date(r.date).toLocaleDateString() },
    { header: t("maintenanceRecords.bus"), accessor: (r: MaintenanceRecord) => busLabelOf(r.busId) },
    { header: t("maintenanceRecords.facility"), accessor: (r: MaintenanceRecord) => facilityNameOf(r.facilityId) || "—" },
    {
      header: t("maintenanceRecords.type"),
      accessor: (r: MaintenanceRecord) => (
        <Badge variant="outline">{t(`fleet.maint.${r.type}`, { defaultValue: r.type })}</Badge>
      ),
    },
    { header: t("maintenanceRecords.description"), accessor: (r: MaintenanceRecord) => r.description },
    { header: t("maintenanceRecords.performedBy"), accessor: (r: MaintenanceRecord) => r.performedBy || "—" },
    { header: t("maintenanceRecords.cost"), accessor: (r: MaintenanceRecord) => <span className="font-medium">CFA {(r.cost || 0).toFixed(2)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <ClipboardList size={26} className="text-primary" /> {t("maintenanceRecords.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("maintenanceRecords.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full space-y-1 sm:w-64">
          <label className="text-xs font-medium text-muted-foreground">{t("maintenanceRecords.filterBus")}</label>
          <select
            value={busId}
            onChange={(e) => setBusId(e.target.value)}
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            <option value="">{t("maintenanceRecords.allBuses")}</option>
            {buses.map((b) => (
              <option key={b._id} value={b._id}>{busSelectLabel(b)}</option>
            ))}
          </select>
        </div>
        <div className="w-full space-y-1 sm:w-64">
          <label className="text-xs font-medium text-muted-foreground">{t("maintenanceRecords.filterFacility")}</label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            <option value="">{t("maintenanceRecords.allFacilities")}</option>
            {facilities.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={records} isLoading={loading} />
    </div>
  );
};

export default MaintenanceRecordsPage;
