import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  onRowClick,
}: DataTableProps<T>) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 border-b">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.length > 0 ? (
            data.map((item, rowIdx) => {
              const key = ((item as Record<string, unknown>)?._id || (item as Record<string, unknown>)?.id || rowIdx) as string | number;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "transition-colors hover:bg-secondary/30",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((column, colIdx) => (
                    <td key={colIdx} className={cn("p-4 align-middle", column.className)}>
                      {typeof column.accessor === "function"
                        ? column.accessor(item)
                        : (item[column.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {t("common.noResults")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
