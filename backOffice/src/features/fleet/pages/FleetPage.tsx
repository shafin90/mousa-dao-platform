import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFleet } from "../hooks/useFleet";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Plus, Trash2, Search, X } from "lucide-react";
import { Modal } from "@/shared/components/modals/Modal";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import type { BusData } from "@/api/busApi";

const FleetPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useErrorModal();
  const { isAdmin } = useAuth();
  const { fleet, loading, remove } = useFleet();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState<BusData | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const columns = [
    { header: t("fleet.busNumber"), accessor: (item: BusData) => <span className="font-bold">{item.busNumber}</span> },
    { header: t("fleet.name"), accessor: "name" as keyof BusData },
    { header: t("fleet.type"), accessor: "type" as keyof BusData },
    { header: t("fleet.capacity"), accessor: "capacity" as keyof BusData },
    { header: t("fleet.driver"), accessor: (item: BusData) => item.assignedDriver ? `${item.assignedDriver.profile?.firstName || ''} ${item.assignedDriver.profile?.lastName || ''}`.trim() || t("fleet.unassigned") : t("fleet.unassigned") },
    { header: t("fleet.status"), accessor: (item: BusData) => {
        const variants: Record<string, "success"|"warning"|"destructive"> = { active: "success", maintenance: "warning", inactive: "destructive" };
        return <Badge variant={variants[item.status] || "outline"}>{t(`fleet.${item.status}`, { defaultValue: item.status?.toUpperCase() })}</Badge>;
    }},
    {
      header: t("fleet.actions"),
      accessor: (item: BusData) => (
        <div className="flex justify-end">
          {isAdmin && (
            <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setBusToDelete(item); setIsDeleteOpen(true); }}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "maintenance", label: "Maintenance" },
    { value: "inactive", label: "Inactive" },
  ] as const;

  const filteredFleet = fleet.filter((b) => {
    if (filterStatus && b.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.busNumber.toLowerCase().includes(q) && !b.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasFilters = search || filterStatus;

  return (
    <div>
      <div data-tour="fleet-table">
        <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
          <div className="relative flex-1 min-w-[160px] max-w-[260px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search bus number or name..."
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
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="w-px h-5 bg-border" />
            {isAdmin && (
              <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate("/fleet/new")}>
                <Plus size={13} /> Add
              </Button>
            )}
            {hasFilters && (
              <button onClick={() => { setSearch(""); setFilterStatus(""); }} className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>
        <DataTable className="rounded-t-none border-t-0" columns={columns} data={filteredFleet} isLoading={loading} onRowClick={(item) => navigate(`/fleet/${item._id}`)} />
      </div>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setBusToDelete(null); }} title={t("fleet.deleteBus")}>
        {busToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("fleet.confirmDelete", { number: busToDelete.busNumber, name: busToDelete.name })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setBusToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={() => { remove(busToDelete._id); toast.success(t("fleet.deleted")); setIsDeleteOpen(false); setBusToDelete(null); }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default FleetPage;
