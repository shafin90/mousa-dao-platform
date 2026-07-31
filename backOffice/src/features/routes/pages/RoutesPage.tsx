import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useRoutes } from "../hooks/useRoutes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/modals/Modal";
import { Pencil, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { routeApi, type RouteData } from "@/api/routeApi";

const RoutesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useErrorModal();
  const { isAdmin } = useAuth();
  const { routes, loading, remove, refresh } = useRoutes();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<RouteData | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");

  const columns = [
    { header: t("routes.from"), accessor: (item: RouteData) => item.fromCity?.name || item.fromCity?._id || t("common.na") },
    { header: t("routes.to"), accessor: (item: RouteData) => item.toCity?.name || item.toCity?._id || t("common.na") },
    { header: t("routes.distance"), accessor: (item: RouteData) => `${item.distanceKm} km` },
    {
      header: t("routes.actions"),
      accessor: (item: RouteData) => (
        <div className="flex gap-1">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0" title={t("common.edit")} onClick={(e) => {
                e.stopPropagation();
                navigate(`/routes/${item._id}/edit`);
              }}>
                <Pencil size={12} />
              </Button>
              <Button variant="outline" size="sm" onClick={async (e) => {
                e.stopPropagation();
                try { await routeApi.update(item._id, { isActive: !item.isActive }); toast.success(t("routes.updated")); refresh(); }
                catch { showError(t("routes.saveFailed")); }
              }}>
                {item.isActive !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              </Button>
              <Button variant="destructive" size="sm" onClick={(e) => {
                e.stopPropagation();
                setRouteToDelete(item);
                setIsDeleteOpen(true);
              }}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filteredRoutes = routes.filter((r) => {
    if (filterStatus === "active" && r.isActive === false) return false;
    if (filterStatus === "inactive" && r.isActive !== false) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.fromCity?.name?.toLowerCase().includes(q) && !r.toCity?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasFilters = search || filterStatus !== "active";

  return (
    <div>
      <div data-tour="routes-table">
        <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
          <div className="relative flex-1 min-w-[160px] max-w-[260px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search routes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-7 pl-8 pr-7 rounded border bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="w-px h-5 bg-border" />
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={refresh} title="Refresh"><RefreshCw size={13} /></Button>
            {isAdmin && (
              <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate("/routes/new")}>
                <Plus size={13} /> New
              </Button>
            )}
            {hasFilters && (
              <button onClick={() => { setSearch(""); setFilterStatus("active"); }} className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>
        <DataTable className="rounded-t-none border-t-0" columns={columns} data={filteredRoutes} isLoading={loading} onRowClick={(item) => navigate(`/routes/${item._id}`)} /></div>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setRouteToDelete(null); }} title={t("routes.deleteRoute")}>
        {routeToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("routes.confirmDelete", { from: routeToDelete.fromCity?.name || t("common.na"), to: routeToDelete.toCity?.name || t("common.na") })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setRouteToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={() => { remove(routeToDelete._id); toast.success(t("routes.deleted")); setIsDeleteOpen(false); setRouteToDelete(null); }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default RoutesPage;
