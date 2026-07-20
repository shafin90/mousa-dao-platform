import React from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import type { RouteStopInput, StopStatus } from "@/api/routeApi";
import type { CityData } from "@/api/cityApi";
import type { StationData } from "@/api/stationApi";

interface Props {
  value: RouteStopInput[];
  cities: CityData[];
  stations: StationData[];
  onChange: (stops: RouteStopInput[]) => void;
}

export const RouteStopsEditor: React.FC<Props> = ({ value, cities, stations, onChange }) => {
  const { t } = useTranslation();

  const cityOptions = cities.map((c) => ({ value: c._id, label: c.name }));
  const statusOptions: Array<{ value: StopStatus; label: string }> = [
    { value: "confirmed", label: t("stops.status_confirmed") },
    { value: "pending", label: t("stops.status_pending") },
    { value: "cancelled", label: t("stops.status_cancelled") },
  ];

  const getStationOptions = (cityId: string) =>
    stations
      .filter((s) => {
        const sid = typeof s.cityId === "object" ? s.cityId?._id : s.cityId;
        return sid === cityId;
      })
      .map((s) => ({ value: s._id, label: s.name }));

  const updateStop = (index: number, patch: Partial<RouteStopInput>) => {
    const updated = value.map((s, i) => (i === index ? { ...s, ...patch } : s));
    if (patch.cityId) updated[index].stationId = "";
    onChange(updated);
  };
  const addStop = () => onChange([...value, { cityId: "", status: "confirmed" }]);
  const removeStop = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{t("stops.title")}</label>
        <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addStop} disabled={!cities.length}>
          <Plus size={14} /> {t("stops.addStop")}
        </Button>
      </div>

      {!cities.length && <p className="text-xs text-muted-foreground">{t("stops.noCities")}</p>}

      {value.length === 0 ? (
        cities.length > 0 && <p className="text-xs text-muted-foreground">{t("stops.none")}</p>
      ) : (
        <div className="space-y-2">
          {value.map((stop, i) => {
            const stationOpts = getStationOptions(stop.cityId);
            return (
              <div key={i} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{t("stops.stopN", { n: i + 1 })}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeStop(i)}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">{t("stops.city")}</label>
                    <Select
                      value={typeof stop.cityId === "string" ? stop.cityId : ""}
                      onChange={(e) => updateStop(i, { cityId: e.target.value })}
                      options={cityOptions}
                      placeholder={t("stops.selectCity")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">{t("stops.station")}</label>
                    <Select
                      value={stop.stationId || ""}
                      onChange={(e) => updateStop(i, { stationId: e.target.value })}
                      options={stationOpts}
                      placeholder={stationOpts.length ? t("stops.selectStation") : t("stops.noStations")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">{t("common.status")}</label>
                    <Select
                      value={stop.status || "confirmed"}
                      onChange={(e) => updateStop(i, { status: e.target.value as StopStatus })}
                      options={statusOptions}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RouteStopsEditor;
