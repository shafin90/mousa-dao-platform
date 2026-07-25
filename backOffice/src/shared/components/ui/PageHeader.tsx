import React from "react";
import { cn } from "@/shared/utils/cn";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  children,
  className,
}) => {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4", className)}>
      <div className="space-y-1">
        {title && (
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};
