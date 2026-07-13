import React from "react";
import type { LucideIcon } from "lucide-react";;
import { Card, CardContent } from "@/shared/components/ui/Card";;
import { cn } from "@/shared/utils/cn";;

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">{value}</h3>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Icon size={24} />
          </div>
        </div>
        {(description || trend) && (
          <div className="mt-4 flex items-center gap-2">
            {trend && (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                trend.isUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {trend.isUp ? "+" : "-"}{trend.value}%
              </span>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
