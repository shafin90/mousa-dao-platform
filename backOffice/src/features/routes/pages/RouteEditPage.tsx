import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Navigation,
  Save,
  X,
  Plus,
  Globe,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { normalizeStops, routeApi, type RouteInput, type RouteStopInput } from "@/api/routeApi";
import { cityApi, type CityData } from "@/api/cityApi";
import { stationApi, type StationData } from "@/api/stationApi";
import { RouteStopsEditor } from "../components/RouteStopsEditor";

interface RouteForm {
  fromCity: string;
  toCity: string;
  fromStations: string[];
  toStations: string[];
  distanceKm: string;
  estimatedTimeMinutes: string;
  baseRate: string;
  isActive: boolean;
  stops: RouteStopInput[];
}

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

const RouteEditPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showError } = useErrorModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RouteForm>({
    fromCity: "", toCity: "", fromStations: [], toStations: [], distanceKm: "", estimatedTimeMinutes: "", baseRate: "", isActive: true, stops: [],
  });
  const [cities, setCities] = useState<CityData[]>([]);
  const [stations, setStations] = useState<StationData[]>([]);
  const [calcLoading, setCalcLoading] = useState(false);
  const calcTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const userChangedCitiesRef = useRef(false);

  useEffect(() => {
    Promise.all([cityApi.getAll(), stationApi.getAll()])
      .then(([c, s]) => { setCities(c.data); setStations(s); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    routeApi.getById(id)
      .then((route) => {
        if (cancelled) return;
        setForm({
          fromCity: idOf(route.fromCity),
          toCity: idOf(route.toCity),
          fromStations: (route.fromStations || []).map((s) => idOf(s)),
          toStations: (route.toStations || []).map((s) => idOf(s)),
          distanceKm: String(route.distanceKm || ""),
          estimatedTimeMinutes: String(route.estimatedTimeMinutes || ""),
          baseRate: route.baseRate != null ? String(route.baseRate) : "",
          isActive: route.isActive !== false,
          stops: normalizeStops(route.stops),
        });
      })
      .catch(() => showError(t("routes.notFound")))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (calcTimeout.current) clearTimeout(calcTimeout.current);
    if (!userChangedCitiesRef.current) return;
    if (!form.fromCity || !form.toCity || form.fromCity === form.toCity) return;
    calcTimeout.current = setTimeout(async () => {
      setCalcLoading(true);
      try {
        const result = await cityApi.getDistance(form.fromCity, form.toCity);
        setForm((prev) => ({ ...prev, distanceKm: String(result.distanceKm), estimatedTimeMinutes: String(result.estimatedTimeMinutes) }));
      } catch {
        showError(t("routes.distanceCalcFailed"));
      } finally {
        setCalcLoading(false);
      }
    }, 600);
    return () => { if (calcTimeout.current) clearTimeout(calcTimeout.current); };
  }, [form.fromCity, form.toCity]);

  const cityOptions = cities.map((c) => ({
    value: c._id,
    label: `${c.name} (${c.country})`,
  }));

  const getStationOptions = (cityId: string) =>
    stations.filter((s) => {
      const cid = typeof s.cityId === "object" ? s.cityId?._id : s.cityId;
      return cid === cityId;
    }).map((s) => ({ value: s._id, label: s.name }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (form.fromCity === form.toCity) {
      showError(t("routes.stationsMustDiff"));
      return;
    }
    setSaving(true);
    try {
      const payload: RouteInput = {
        fromCity: form.fromCity,
        toCity: form.toCity,
        fromStations: form.fromStations.filter(Boolean),
        toStations: form.toStations.filter(Boolean),
        distanceKm: Number(form.distanceKm),
        estimatedTimeMinutes: Number(form.estimatedTimeMinutes) || undefined,
        baseRate: form.baseRate ? Number(form.baseRate) : undefined,
        isActive: form.isActive,
        stops: form.stops.filter((s) => s.cityId),
      };
      await routeApi.update(id, payload as any);
      toast.success(t("routes.updated"));
      navigate(`/routes/${id}`);
    } catch {
      showError(t("routes.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate(`/routes/${id}`)}>
            <ArrowLeft size={16} /> {t("routes.backToRoutes")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Navigation size={22} className="text-primary" />
            {t("routes.editRoute")}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe size={18} className="text-primary" /> {t("routes.routeDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("routes.departureCity")}</label>
                  <Select
                    required
                    value={form.fromCity}
                    onChange={(e) => { userChangedCitiesRef.current = true; setForm({ ...form, fromCity: e.target.value }); }}
                    options={cityOptions}
                    placeholder={t("routes.selectFromStation")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("routes.destinationCity")}</label>
                  <Select
                    required
                    value={form.toCity}
                    onChange={(e) => { userChangedCitiesRef.current = true; setForm({ ...form, toCity: e.target.value }); }}
                    options={cityOptions}
                    placeholder={t("routes.selectToStation")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Navigation size={18} className="text-primary" /> {t("routes.distance")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">{t("routes.distanceKm")}</label>
                    <div className="relative">
                      <input required type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} placeholder={t("routes.distancePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      {calcLoading && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">{t("routes.estTimeMinutes")}</label>
                    <input type="number" value={form.estimatedTimeMinutes} onChange={(e) => setForm({ ...form, estimatedTimeMinutes: e.target.value })} placeholder={t("routes.estTimePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck size={18} className="text-primary" /> {t("common.status")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                    <span className="text-sm font-medium">{t("routes.active")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-destructive" />
                    <span className="text-sm font-medium">{t("routes.inactive")}</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={18} className="text-primary" /> {t("routes.fromStations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {form.fromCity ? (
                  <div className="space-y-2">
                    {form.fromStations.map((sid, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select
                            value={sid}
                            onChange={(e) => {
                              const updated = [...form.fromStations];
                              updated[i] = e.target.value;
                              setForm({ ...form, fromStations: updated });
                            }}
                            options={getStationOptions(form.fromCity)}
                            placeholder={t("routes.selectStation")}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, fromStations: form.fromStations.filter((_, j) => j !== i) })}>
                          <X size={14} className="text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setForm({ ...form, fromStations: [...form.fromStations, ""] })}>
                      <Plus size={14} /> {t("routes.addFromStation")}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("routes.selectFromStation")}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={18} className="text-primary" /> {t("routes.toStations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {form.toCity ? (
                  <div className="space-y-2">
                    {form.toStations.map((sid, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select
                            value={sid}
                            onChange={(e) => {
                              const updated = [...form.toStations];
                              updated[i] = e.target.value;
                              setForm({ ...form, toStations: updated });
                            }}
                            options={getStationOptions(form.toCity)}
                            placeholder={t("routes.selectStation")}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, toStations: form.toStations.filter((_, j) => j !== i) })}>
                          <X size={14} className="text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setForm({ ...form, toStations: [...form.toStations, ""] })}>
                      <Plus size={14} /> {t("routes.addToStation")}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("routes.selectToStation")}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Navigation size={18} className="text-primary" /> {"Stops"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RouteStopsEditor
                  value={form.stops}
                  cities={cities}
                  stations={stations}
                  onChange={(stops) => setForm((prev) => ({ ...prev, stops }))}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => navigate(`/routes/${id}`)}>
            <X size={16} /> {t("common.cancel")}
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save size={16} /> {saving ? t("common.saving") : t("common.update")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RouteEditPage;
