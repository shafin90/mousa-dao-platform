import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import type { AlertItem } from "@/api/analyticsApi";

interface Props {
  data: AlertItem[];
  loading?: boolean;
}

const ICON_MAP = {
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const STYLE_MAP = {
  warning: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
  error: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
  success: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
};

export const AlertsPanel: React.FC<Props> = ({ data, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((alert, i) => {
        const Icon = ICON_MAP[alert.type];
        return (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm ${STYLE_MAP[alert.type]}`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="flex-1">{t(`alerts.${alert.key}`, { count: alert.count, defaultValue: alert.message })}</span>
            {alert.count > 0 && (
              <span className="font-bold text-xs">{alert.count}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
