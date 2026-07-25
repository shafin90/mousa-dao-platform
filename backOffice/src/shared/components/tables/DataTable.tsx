import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { Download } from "lucide-react";

interface Column<T> {
  header: React.ReactNode;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

function exportCsv<T>(data: T[], columns: Column<T>[], filename: string) {
  const header = columns.map((c) => {
    if (typeof c.header === "string") return `"${c.header}"`;
    return "";
  }).filter(Boolean).join(",");

  const rows = data.map((item) =>
    columns.map((col) => {
      const val = typeof col.accessor === "function" ? col.accessor(item) : item[col.accessor];
      const str = val != null ? String(val).replace(/"/g, '""') : "";
      return `"${str}"`;
    }).join(",")
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  exportable?: boolean;
  exportFilename?: string;
  className?: string;
  /** Total rows (for server-side pagination) */
  totalRows?: number;
  /** Server-side pagination: total pages from server */
  totalPages?: number;
  /** Server-side pagination: current page (1-indexed) */
  currentPage?: number;
  /** Server-side pagination: called when user clicks a page */
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  onRowClick,
  pageSize = 15,
  exportable,
  exportFilename = "export",
  className,
  totalRows: serverTotalRows,
  totalPages: serverTotalPages,
  currentPage: serverPage,
  onPageChange,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const isServerPaginated = serverTotalPages != null && serverPage != null && onPageChange != null;
  const [clientPage, setClientPage] = React.useState(0);

  const page = isServerPaginated ? serverPage! - 1 : clientPage;
  const setPage = isServerPaginated ? (p: number) => onPageChange!(p + 1) : setClientPage;

  React.useEffect(() => { if (!isServerPaginated) setPage(0); }, [data.length]);

  const totalPages = isServerPaginated ? serverTotalPages! : Math.max(1, Math.ceil(data.length / pageSize));
  const paginatedData = isServerPaginated ? data : data.slice(page * pageSize, (page + 1) * pageSize);
  const totalRows = isServerPaginated ? Math.max(0, serverTotalRows ?? 0) : data.length;
  const startRow = totalRows === 0 ? 0 : page * pageSize + 1;
  const endRow = Math.min((page + 1) * pageSize, totalRows);

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
    <div className={cn("relative w-full overflow-auto rounded-lg border bg-card", className)}>
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 border-b">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={cn(
                  "h-8 px-3 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider border-r last:border-r-0",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {paginatedData.length > 0 ? (
            paginatedData.map((item, rowIdx) => {
              const key = ((item as Record<string, unknown>)?._id || (item as Record<string, unknown>)?.id || rowIdx) as string | number;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "transition-all duration-150 hover:bg-secondary/50 even:bg-muted/20",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((column, colIdx) => (
                    <td key={colIdx} className={cn("px-3 py-1.5 align-middle border-r last:border-r-0", column.className)}>
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
              <td colSpan={columns.length} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/30">
                    <rect x="6" y="14" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <line x1="14" y1="22" x2="34" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="14" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="14" y1="34" x2="22" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="38" cy="10" r="6" fill="currentColor" opacity="0.15" />
                  </svg>
                  <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t px-3 py-2">
        <div className="flex items-center gap-2">
          {exportable && data.length > 0 && (
            <button
              onClick={() => exportCsv(data, columns, exportFilename)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Download size={12} />
              CSV
            </button>
          )}
          {totalRows > 0 && (
            <p className="text-xs text-muted-foreground">
              {startRow}–{endRow} of {totalRows}
            </p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
                  i === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
