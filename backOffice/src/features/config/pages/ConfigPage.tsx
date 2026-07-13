import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfig } from "../hooks/useConfig";
import { Button } from "@/shared/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Save, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const FEATURE_FLAG_LABELS: Record<string, string> = {
  enableBooking: "config.enableBooking",
  enablePayments: "config.enablePayments",
  enableTicketing: "config.enableTicketing",
};

const ConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const { config, loading, update, reset, refresh } = useConfig();
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});

  React.useEffect(() => {
    if (config) {
      setForm({
        baseCurrency: config.baseCurrency,
        timezone: config.timezone,
        platformCommissionPercentage: config.platformCommissionPercentage,
        driverCommissionPercentage: config.driverCommissionPercentage,
        taxPercentage: config.taxPercentage,
        maintenanceMode: false,
        enableBooking: config.featureFlags?.enableBooking ?? true,
        enablePayments: config.featureFlags?.enablePayments ?? true,
        enableTicketing: config.featureFlags?.enableTicketing ?? true,
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await update({
        baseCurrency: form.baseCurrency as string,
        timezone: form.timezone as string,
        platformCommissionPercentage: Number(form.platformCommissionPercentage),
        driverCommissionPercentage: Number(form.driverCommissionPercentage),
        taxPercentage: Number(form.taxPercentage),
        maintenanceMode: Boolean(form.maintenanceMode),
        featureFlags: {
          enableBooking: Boolean(form.enableBooking),
          enablePayments: Boolean(form.enablePayments),
          enableTicketing: Boolean(form.enableTicketing),
        },
      } as Partial<import("@/api/configApi").ConfigData>);
      toast.success(t("config.saved"));
    } catch { toast.error(t("config.saveFailed")); }
  };

  const handleReset = async () => {
    try {
      await reset();
      toast.success(t("config.resetDone"));
      refresh();
    } catch { toast.error(t("config.resetFailed")); }
  };

  if (loading || !config) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("config.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("config.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}><RefreshCw size={16} /> {t("common.refresh")}</Button>
          <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={handleReset}><RotateCcw size={16} /> {t("config.reset")}</Button>
          <Button size="sm" className="gap-2" onClick={handleSave}><Save size={16} /> {t("common.save")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("config.general")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("config.baseCurrency")}</label>
              <input type="text" value={form.baseCurrency as string} onChange={e => setForm({...form, baseCurrency: e.target.value})} className="w-full p-2 border rounded-md bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("config.timezone")}</label>
              <input type="text" value={form.timezone as string} onChange={e => setForm({...form, timezone: e.target.value})} className="w-full p-2 border rounded-md bg-background" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("config.commissionsAndTax")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("config.platformCommission")}</label>
              <input type="number" value={form.platformCommissionPercentage as number} onChange={e => setForm({...form, platformCommissionPercentage: Number(e.target.value)})} className="w-full p-2 border rounded-md bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("config.driverCommission")}</label>
              <input type="number" value={form.driverCommissionPercentage as number} onChange={e => setForm({...form, driverCommissionPercentage: Number(e.target.value)})} className="w-full p-2 border rounded-md bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("config.tax")}</label>
              <input type="number" value={form.taxPercentage as number} onChange={e => setForm({...form, taxPercentage: Number(e.target.value)})} className="w-full p-2 border rounded-md bg-background" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("config.featureFlags")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {['enableBooking', 'enablePayments', 'enableTicketing'].map(flag => (
              <label key={flag} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={Boolean(form[flag])} onChange={e => setForm({...form, [flag]: e.target.checked})} className="w-4 h-4" />
                <span className="text-sm font-medium">{t(FEATURE_FLAG_LABELS[flag])}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* MAINTENANCE MODE DISABLED
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("config.maintenance")}</CardTitle></CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={Boolean(form.maintenanceMode)} onChange={e => setForm({...form, maintenanceMode: e.target.checked})} className="w-4 h-4" />
              <span className="text-sm font-medium">{t("config.maintenanceMode")}</span>
            </label>
            <p className="text-xs text-muted-foreground mt-2">{t("config.maintenanceHelper")}</p>
          </CardContent>
        </Card>
        */}
      </div>
    </div>
  );
};
export default ConfigPage;
