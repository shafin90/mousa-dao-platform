import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TrackingMap } from "../components/TrackingMap";
import { getActiveBuses, type GpsBus } from "../api/trackingApi";

export default function LiveTrackingPage() {
  const { t } = useTranslation();
  const [buses, setBuses] = useState<GpsBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<GpsBus | null>(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const data = await getActiveBuses();
      setBuses(data);
    } catch {
      // handled by apiClient toast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? buses : buses.filter((b) => b.status === filter);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      <div className="w-72 shrink-0 bg-card border border-border rounded-xl p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">{t("nav.tracking")}</h2>
        <div className="mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
          >
            <option value="all">{t("tracking.allBuses")} ({buses.length})</option>
            <option value="on_trip">{t("tracking.onTrip")} ({buses.filter(b => b.status === "on_trip").length})</option>
            <option value="idle">{t("tracking.idle")} ({buses.filter(b => b.status === "idle").length})</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("tracking.noBuses")}</p>
          )}
          {filtered.map((bus) => (
            <button
              key={bus.id}
              onClick={() => setSelectedBus(selectedBus?.id === bus.id ? null : bus)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedBus?.id === bus.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{bus.busNumber}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  bus.status === "on_trip"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {bus.speed > 0 ? `${bus.speed} km/h` : bus.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border border-border">
        <TrackingMap
          buses={filtered}
          selectedBusId={selectedBus?.id || null}
          onBusSelect={setSelectedBus}
        />
      </div>
    </div>
  );
}
