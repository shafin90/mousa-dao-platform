import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Select } from "@/shared/components/ui/Select";
import { Modal } from "@/shared/components/modals/Modal";
import { DataTable } from "@/shared/components/tables/DataTable";
import type { RouteStop, RouteStopInput, StopStatus } from "@/api/routeApi";
import type { CityData } from "@/api/cityApi";

interface StopsCardProps {
  stops: RouteStop[];
  cities: CityData[];
  onAdd?: (stop: RouteStopInput) => Promise<void>;
  isLoading?: boolean;
}

interface StopRow extends RouteStop {
  order: number;
  city: string;
}

const statusVariant = (status?: StopStatus) => {
  switch (status) {
    case "cancelled":
      return "destructive" as const;
    case "pending":
      return "warning" as const;
    default:
      return "success" as const;
  }
};

/** Resolves the city name for a stop, whether populated or a raw id. */
const resolveCityName = (stop: RouteStop, cities: CityData[], fallback: string): string => {
  if (stop.cityId && typeof stop.cityId === "object") return stop.cityId.name || fallback;
  return cities.find((c) => c._id === stop.cityId)?.name || fallback;
};

export const StopsCard: React.FC<StopsCardProps> = ({ stops, cities, onAdd, isLoading }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ cityId: "", arrivalTime: "", departureTime: "" });

  const rows = useMemo<StopRow[]>(
    () =>
      (stops || []).map((stop, i) => ({
        ...stop,
        order: i + 1,
        city: resolveCityName(stop, cities, t("common.na")),
      })),
    [stops, cities, t]
  );

  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c._id, label: c.name })),
    [cities]
  );

  const columns = [
    { header: t("stops.stopNumber"), className: "w-28", accessor: (row: StopRow) => row.order },
    { header: t("stops.city"), accessor: (row: StopRow) => row.city },
    { header: t("stops.arrivalTime"), accessor: (row: StopRow) => row.arrivalTime || "—" },
    { header: t("stops.departureTime"), accessor: (row: StopRow) => row.departureTime || "—" },
    {
      header: t("common.status"),
      accessor: (row: StopRow) => (
        <Badge variant={statusVariant(row.status)}>{t(`stops.status_${row.status || "confirmed"}`)}</Badge>
      ),
    },
  ];

  const resetForm = () => setForm({ cityId: "", arrivalTime: "", departureTime: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityId) {
      toast.error(t("stops.selectCityRequired"));
      return;
    }
    if (!onAdd) return;
    setSaving(true);
    try {
      await onAdd({
        cityId: form.cityId,
        arrivalTime: form.arrivalTime,
        departureTime: form.departureTime,
        status: "confirmed",
      });
      toast.success(t("stops.added"));
      setIsOpen(false);
      resetForm();
    } catch {
      toast.error(t("stops.addFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin size={18} className="text-primary" /> {t("stops.title")}
        </CardTitle>
        {onAdd && (
          <Button size="sm" className="gap-2" onClick={() => { resetForm(); setIsOpen(true); }}>
            <Plus size={16} /> {t("stops.addStop")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={rows} isLoading={isLoading} />
      </CardContent>

      {onAdd && (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={t("stops.addStop")}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("stops.city")}</label>
              <Select
                value={form.cityId}
                onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                options={cityOptions}
                placeholder={cities.length ? t("stops.selectCity") : t("stops.noCities")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("stops.arrivalTime")}</label>
                <input
                  type="time"
                  value={form.arrivalTime}
                  onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                  className="w-full rounded-md border bg-background p-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("stops.departureTime")}</label>
                <input
                  type="time"
                  value={form.departureTime}
                  onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                  className="w-full rounded-md border bg-background p-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving") : t("stops.saveStop")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
};

export default StopsCard;
