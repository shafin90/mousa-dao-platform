import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Settings, ShieldCheck, DollarSign, Clock, Percent, ToggleLeft, Wrench, Globe } from "lucide-react";
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher";

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Settings size={24} /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("config.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("config.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings size={18} className="text-primary" /> {t("config.general")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={16} className="text-muted-foreground" />
                <span>{t("config.baseCurrency")}</span>
              </div>
              <span className="text-sm font-medium">CFA</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-muted-foreground" />
                <span>{t("config.timezone")}</span>
              </div>
              <span className="text-sm font-medium">UTC+0</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm">
                <Globe size={16} className="text-muted-foreground" />
                <span>Language</span>
              </div>
              <LanguageSwitcher />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent size={18} className="text-primary" /> {t("config.commissionsAndTax")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">{t("config.platformCommission")}</span>
              <span className="text-sm font-medium">10%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">{t("config.driverCommission")}</span>
              <span className="text-sm font-medium">85%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">{t("config.tax")}</span>
              <span className="text-sm font-medium">5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ToggleLeft size={18} className="text-primary" /> {t("config.featureFlags")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "enableBooking", label: t("config.enableBooking") },
              { key: "enablePayments", label: t("config.enablePayments") },
              { key: "enableTicketing", label: t("config.enableTicketing") },
            ].map((f) => (
              <div key={f.key} className="flex items-center justify-between py-2">
                <span className="text-sm">{f.label}</span>
                <div className="h-5 w-9 rounded-full bg-primary cursor-pointer relative">
                  <div className="h-4 w-4 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench size={18} className="text-primary" /> {t("config.maintenance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm">{t("config.maintenanceMode")}</p>
                <p className="text-xs text-muted-foreground">{t("config.maintenanceHelper")}</p>
              </div>
              <div className="h-5 w-9 rounded-full bg-muted cursor-pointer relative">
                <div className="h-4 w-4 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
