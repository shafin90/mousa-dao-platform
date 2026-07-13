import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Calendar } from "lucide-react";

export type DateRange = "today" | "7d" | "30d" | "custom";

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (d: string) => void;
  onEndDateChange?: (d: string) => void;
}

export const AnalyticsFilters: React.FC<Props> = ({
  value, onChange, startDate, endDate, onStartDateChange, onEndDateChange,
}) => {
  const { t } = useTranslation();

  const OPTIONS: { value: DateRange; label: string }[] = [
    { value: "today", label: t("analytics.filters.today") },
    { value: "7d", label: t("analytics.filters.last7Days") },
    { value: "30d", label: t("analytics.filters.last30Days") },
    { value: "custom", label: t("analytics.filters.custom") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "primary" : "outline"}
          size="sm"
          onClick={() => onChange(opt.value)}
        >
          {opt.value === "custom" && <Calendar size={14} className="mr-1" />}
          {opt.label}
        </Button>
      ))}
      {value === "custom" && onStartDateChange && onEndDateChange && (
        <div className="flex items-center gap-2 ml-2">
          <input type="date" value={startDate || ""} onChange={(e) => onStartDateChange(e.target.value)} className="p-1.5 text-xs border rounded-md bg-card" />
          <span className="text-xs text-muted-foreground">—</span>
          <input type="date" value={endDate || ""} onChange={(e) => onEndDateChange(e.target.value)} className="p-1.5 text-xs border rounded-md bg-card" />
        </div>
      )}
    </div>
  );
};
