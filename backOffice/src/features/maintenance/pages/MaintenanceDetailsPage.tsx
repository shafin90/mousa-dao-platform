import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Wrench, Calendar, Bus, Building2, DollarSign, FileText, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { maintenanceRecordApi, type MaintenanceRecord } from "@/api/maintenanceRecordApi";
import { busApi, type BusData } from "@/api/busApi";
import { maintenanceFacilityApi, type MaintenanceFacilityData } from "@/api/maintenanceFacilityApi";

const busLabelOf = (value: MaintenanceRecord["busId"]): string => {
  if (value && typeof value === "object") return value.busNumber || value.name || "—";
  return "—";
};

const facilityNameOf = (value: MaintenanceRecord["facilityId"]): string => {
  if (value && typeof value === "object" && "name" in value) return value.name;
  return "";
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const MaintenanceDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [bus, setBus] = useState<BusData | null>(null);
  const [facility, setFacility] = useState<MaintenanceFacilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await maintenanceRecordApi.getById(id);
        if (!active) return;
        setRecord(data);

        const busId = typeof data.busId === "string" ? data.busId : data.busId?._id;
        const facilityId = typeof data.facilityId === "string" ? data.facilityId : data.facilityId?._id;

        if (busId) busApi.getById(busId).then((b) => { if (active) setBus(b); }).catch(() => {});
        if (facilityId) maintenanceFacilityApi.getById(facilityId).then((f) => { if (active) setFacility(f); }).catch(() => {});
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !record) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/maintenance-records")}>
          <ArrowLeft size={16} /> {t("maintenanceRecords.backToRecords")}
        </Button>
        <Card><CardContent className="p-10 text-center text-muted-foreground">{t("maintenanceRecords.notFound")}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/maintenance-records")}>
            <ArrowLeft size={16} /> {t("maintenanceRecords.backToRecords")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Wrench size={22} className="text-primary" />
            <span>{busLabelOf(record.busId)}</span>
            <Badge variant="outline">{t(`maintenance.type.${record.type}`, { defaultValue: record.type })}</Badge>
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{record._id}</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/maintenance-records", { state: { editRecordId: record._id } })}>
          {t("common.edit")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Calendar size={18} />}
          label={t("maintenanceRecords.date")}
          value={new Date(record.date).toLocaleDateString()}
        />
        <StatCard
          icon={<Bus size={18} />}
          label={t("maintenanceRecords.bus")}
          value={bus ? `${bus.busNumber}${bus.name ? ` · ${bus.name}` : ""}` : busLabelOf(record.busId)}
        />
        <StatCard
          icon={<Building2 size={18} />}
          label={t("maintenanceRecords.facility")}
          value={facilityNameOf(record.facilityId) || "—"}
        />
        <StatCard
          icon={<DollarSign size={18} />}
          label={t("maintenanceRecords.cost")}
          value={`CFA ${(record.cost || 0).toFixed(2)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><FileText size={16} /> {t("maintenanceRecords.description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{record.description || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><CalendarClock size={16} /> {t("maintenanceRecords.additionalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("maintenanceRecords.performedBy")}</span>
              <span className="font-medium">{record.performedBy || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("maintenanceRecords.createdAt")}</span>
              <span className="font-medium">{record.createdAt ? new Date(record.createdAt).toLocaleString() : "—"}</span>
            </div>
            {record.updatedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("maintenanceRecords.updatedAt")}</span>
                <span className="font-medium">{new Date(record.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {facility && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Building2 size={16} /> {t("maintenanceRecords.facilityDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t("maintenanceRecords.facilityName")}</p>
              <p className="font-medium">{facility.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("maintenanceRecords.facilityAddress")}</p>
              <p className="font-medium">{facility.address || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("maintenanceRecords.facilityPhone")}</p>
              <p className="font-medium">{facility.phone || "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MaintenanceDetailsPage;
