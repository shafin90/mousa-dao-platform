import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, ClipboardList, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import {
  workOrderApi,
  type WorkOrderData,
  type WorkOrderPayload,
  type WorkOrderStatus,
  type WorkOrderPriority,
} from "@/api/workOrderApi";
import { busApi, type BusData } from "@/api/busApi";
import { maintenanceStaffApi, type MaintenanceStaffData } from "@/api/maintenanceStaffApi";
import { maintenanceFacilityApi, type MaintenanceFacilityData } from "@/api/maintenanceFacilityApi";

const TYPES = ["routine", "repair", "inspection", "other"] as const;
const PRIORITIES: WorkOrderPriority[] = ["low", "medium", "high", "urgent"];
const STATUSES: WorkOrderStatus[] = ["pending", "in_progress", "waiting_parts", "completed", "cancelled"];

const priorityVariant = (priority: WorkOrderPriority) => {
  switch (priority) {
    case "urgent":
      return "destructive" as const;
    case "high":
      return "warning" as const;
    case "medium":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const nameOf = (value: WorkOrderData["assignedTechnician"] | WorkOrderData["facilityId"]): string => {
  if (value && typeof value === "object" && "name" in value) return value.name || "—";
  return "—";
};

const busLabelOf = (value: WorkOrderData["busId"]): string => {
  if (value && typeof value === "object") return value.busNumber || value.name || "—";
  return "—";
};

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

const busSelectLabel = (b: BusData): string => {
  const number = b.busNumber || "";
  const name = b.name || "";
  if (number && name && number !== name) return `${number} · ${name}`;
  return number || name || b._id;
};

const emptyForm = {
  busId: "",
  maintenanceType: "routine",
  priority: "medium",
  assignedTechnician: "",
  facilityId: "",
  expectedCompletion: "",
  description: "",
  cost: "",
  odometer: "",
  status: "pending",
};

const WorkOrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [staff, setStaff] = useState<MaintenanceStaffData[]>([]);
  const [facilities, setFacilities] = useState<MaintenanceFacilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrderData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<WorkOrderData | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    setLoading(true);
    try {
      const data = await workOrderApi.getAll();
      setWorkOrders(data);
    } catch {
      toast.error(t("maintenance.workOrders.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    busApi.getAll({ limit: 1000 }).then((res) => setBuses(res.buses)).catch(() => setBuses([]));
    maintenanceStaffApi.getAll().then(setStaff).catch(() => setStaff([]));
    maintenanceFacilityApi.getAll().then(setFacilities).catch(() => setFacilities([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeStaff = staff.filter((s) => s.isActive !== false);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (row: WorkOrderData) => {
    setEditing(row);
    setForm({
      busId: idOf(row.busId),
      maintenanceType: row.maintenanceType || "routine",
      priority: row.priority || "medium",
      assignedTechnician: idOf(row.assignedTechnician),
      facilityId: idOf(row.facilityId),
      expectedCompletion: row.expectedCompletion ? row.expectedCompletion.slice(0, 10) : "",
      description: row.description || "",
      cost: row.cost != null ? String(row.cost) : "",
      odometer: row.odometer != null ? String(row.odometer) : "",
      status: row.status || "pending",
    });
    setIsModalOpen(true);
  };

  const buildPayload = (): WorkOrderPayload => ({
    busId: form.busId,
    maintenanceType: form.maintenanceType as WorkOrderPayload["maintenanceType"],
    priority: form.priority as WorkOrderPayload["priority"],
    assignedTechnician: form.assignedTechnician || null,
    facilityId: form.facilityId || null,
    expectedCompletion: form.expectedCompletion || null,
    description: form.description || "",
    cost: form.cost ? Number(form.cost) : 0,
    odometer: form.odometer ? Number(form.odometer) : undefined,
    status: form.status as WorkOrderStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.busId) {
      toast.error(t("maintenance.workOrders.busRequired"));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await workOrderApi.update(editing._id, buildPayload());
        toast.success(t("maintenance.workOrders.updated"));
      } else {
        await workOrderApi.create(buildPayload());
        toast.success(t("maintenance.workOrders.created"));
      }
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      await load();
    } catch {
      toast.error(t("maintenance.workOrders.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (row: WorkOrderData, status: WorkOrderStatus) => {
    if (status === row.status) return;
    try {
      await workOrderApi.updateStatus(row._id, status);
      toast.success(t("maintenance.workOrders.statusUpdated"));
      await load();
    } catch {
      toast.error(t("maintenance.workOrders.saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await workOrderApi.delete(toDelete._id);
      toast.success(t("maintenance.workOrders.deleted"));
      setIsDeleteOpen(false);
      setToDelete(null);
      await load();
    } catch {
      toast.error(t("maintenance.workOrders.deleteFailed"));
    }
  };

  const columns = [
    { header: t("maintenance.workOrders.number"), accessor: (r: WorkOrderData) => <span className="font-mono font-medium">{r.workOrderNumber}</span> },
    { header: t("maintenance.workOrders.bus"), accessor: (r: WorkOrderData) => busLabelOf(r.busId) },
    {
      header: t("maintenance.workOrders.type"),
      accessor: (r: WorkOrderData) => <Badge variant="outline">{t(`maintenance.type.${r.maintenanceType}`, { defaultValue: r.maintenanceType })}</Badge>,
    },
    {
      header: t("maintenance.workOrders.priority"),
      accessor: (r: WorkOrderData) => <Badge variant={priorityVariant(r.priority)}>{t(`maintenance.priority.${r.priority}`, { defaultValue: r.priority })}</Badge>,
    },
    { header: t("maintenance.workOrders.technician"), accessor: (r: WorkOrderData) => nameOf(r.assignedTechnician) },
    { header: t("maintenance.workOrders.facility"), accessor: (r: WorkOrderData) => nameOf(r.facilityId) },
    { header: t("maintenance.workOrders.expectedCompletion"), accessor: (r: WorkOrderData) => (r.expectedCompletion ? new Date(r.expectedCompletion).toLocaleDateString() : "—") },
    {
      header: t("common.status"),
      accessor: (r: WorkOrderData) => (
        <select
          value={r.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleQuickStatus(r, e.target.value as WorkOrderStatus)}
          className="rounded-md border bg-background px-2 py-1 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{t(`maintenance.status.${s}`, { defaultValue: s })}</option>
          ))}
        </select>
      ),
    },
    {
      header: t("common.actions"),
      accessor: (r: WorkOrderData) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
            <Pencil size={14} className="mr-1" /> {t("common.edit")}
          </Button>
          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setToDelete(r); setIsDeleteOpen(true); }}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <ClipboardList size={20} className="text-primary" /> {t("maintenance.workOrders.title")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={16} /> {t("maintenance.workOrders.newWorkOrder")}
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={workOrders} isLoading={loading} />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setToDelete(null); }} title={t("maintenance.workOrders.deleteWorkOrder")}>
        {toDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("maintenance.workOrders.confirmDelete", { number: toDelete.workOrderNumber })}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? t("maintenance.workOrders.editWorkOrder") : t("maintenance.workOrders.createWorkOrder")}
        className="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.busRequiredLabel")}</label>
              <select
                required
                value={form.busId}
                onChange={(e) => setForm({ ...form, busId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenance.workOrders.selectBus")}</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>{busSelectLabel(b)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.type")}</label>
              <select
                value={form.maintenanceType}
                onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                {TYPES.map((ty) => (
                  <option key={ty} value={ty}>{t(`maintenance.type.${ty}`, { defaultValue: ty })}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.priority")}</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{t(`maintenance.priority.${p}`, { defaultValue: p })}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.technician")}</label>
              <select
                value={form.assignedTechnician}
                onChange={(e) => setForm({ ...form, assignedTechnician: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenance.workOrders.noTechnician")}</option>
                {activeStaff.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.facility")}</label>
              <select
                value={form.facilityId}
                onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenance.workOrders.noFacility")}</option>
                {facilities.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.expectedCompletion")}</label>
              <input
                type="date"
                value={form.expectedCompletion}
                onChange={(e) => setForm({ ...form, expectedCompletion: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.status")}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`maintenance.status.${s}`, { defaultValue: s })}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.cost")}</label>
              <input
                type="number"
                min="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder="CFA"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.odometer")}</label>
              <input
                type="number"
                min="0"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder="km"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("maintenance.workOrders.description")}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                rows={3}
                placeholder={t("maintenance.workOrders.descriptionPlaceholder")}
              />
            </div>
          </div>
          {editing && (
            <p className="text-xs text-muted-foreground">{t("maintenance.workOrders.completionHint")}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("maintenance.workOrders.saveWorkOrder")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkOrdersPage;
