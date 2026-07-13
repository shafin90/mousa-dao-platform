import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, CalendarClock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import {
  maintenanceScheduleApi,
  type MaintenanceScheduleData,
  type MaintenanceSchedulePayload,
  type ScheduleStatus,
} from "@/api/maintenanceScheduleApi";
import { busApi, type BusData } from "@/api/busApi";

const TYPES = ["routine", "repair", "inspection", "other"] as const;

const statusVariant = (status: ScheduleStatus) => {
  switch (status) {
    case "overdue":
      return "destructive" as const;
    case "due":
      return "warning" as const;
    case "completed":
      return "success" as const;
    default:
      return "secondary" as const;
  }
};

const busLabelOf = (value: MaintenanceScheduleData["busId"]): string => {
  if (value && typeof value === "object") return value.busNumber || value.name || "—";
  return "—";
};

const busIdOf = (value: MaintenanceScheduleData["busId"]): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id;
};

const busSelectLabel = (b: BusData): string => {
  const number = b.busNumber || "";
  const name = b.name || "";
  if (number && name && number !== name) return `${number} · ${name}`;
  return number || name || b._id;
};

const emptyForm = {
  busId: "",
  title: "",
  maintenanceType: "routine",
  intervalType: "km",
  intervalValue: "",
  lastServiceOdometer: "",
  lastServiceDate: "",
  notes: "",
  isActive: true,
};

const MaintenanceSchedulePage: React.FC = () => {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState<MaintenanceScheduleData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceScheduleData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MaintenanceScheduleData | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    setLoading(true);
    try {
      const data = await maintenanceScheduleApi.getAll();
      setSchedules(data);
    } catch {
      toast.error(t("maintenance.schedule.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    busApi
      .getAll({ limit: 1000 })
      .then((res) => setBuses(res.buses))
      .catch(() => setBuses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (row: MaintenanceScheduleData) => {
    setEditing(row);
    setForm({
      busId: busIdOf(row.busId),
      title: row.title || "",
      maintenanceType: row.maintenanceType || "routine",
      intervalType: row.intervalType || "km",
      intervalValue: String(row.intervalValue ?? ""),
      lastServiceOdometer: row.lastServiceOdometer != null ? String(row.lastServiceOdometer) : "",
      lastServiceDate: row.lastServiceDate ? row.lastServiceDate.slice(0, 10) : "",
      notes: row.notes || "",
      isActive: row.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.busId) {
      toast.error(t("maintenance.schedule.busRequired"));
      return;
    }
    if (!form.intervalValue || Number(form.intervalValue) <= 0) {
      toast.error(t("maintenance.schedule.intervalRequired"));
      return;
    }
    setSaving(true);
    const payload: MaintenanceSchedulePayload = {
      busId: form.busId,
      title: form.title || "",
      maintenanceType: form.maintenanceType as MaintenanceSchedulePayload["maintenanceType"],
      intervalType: form.intervalType as MaintenanceSchedulePayload["intervalType"],
      intervalValue: Number(form.intervalValue),
      lastServiceOdometer: form.lastServiceOdometer ? Number(form.lastServiceOdometer) : 0,
      lastServiceDate: form.lastServiceDate || null,
      notes: form.notes || "",
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await maintenanceScheduleApi.update(editing._id, payload);
        toast.success(t("maintenance.schedule.updated"));
      } else {
        await maintenanceScheduleApi.create(payload);
        toast.success(t("maintenance.schedule.created"));
      }
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      await load();
    } catch {
      toast.error(t("maintenance.schedule.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await maintenanceScheduleApi.delete(toDelete._id);
      toast.success(t("maintenance.schedule.deleted"));
      setIsDeleteOpen(false);
      setToDelete(null);
      await load();
    } catch {
      toast.error(t("maintenance.schedule.deleteFailed"));
    }
  };

  const intervalLabel = (row: MaintenanceScheduleData): string => {
    const value = (row.intervalValue ?? 0).toLocaleString();
    return row.intervalType === "km"
      ? t("maintenance.schedule.everyKm", { value })
      : t("maintenance.schedule.everyMonths", { value });
  };

  const nextDueLabel = (row: MaintenanceScheduleData): string => {
    if (row.isActive === false) return "—";
    if (row.intervalType === "km") {
      return row.nextDueOdometer != null ? `${row.nextDueOdometer.toLocaleString()} km` : "—";
    }
    return row.nextDueDate ? new Date(row.nextDueDate).toLocaleDateString() : "—";
  };

  const columns = [
    { header: t("maintenance.schedule.bus"), accessor: (r: MaintenanceScheduleData) => <span className="font-medium">{busLabelOf(r.busId)}</span> },
    {
      header: t("maintenance.schedule.type"),
      accessor: (r: MaintenanceScheduleData) => (
        <Badge variant="outline">{t(`maintenance.type.${r.maintenanceType}`, { defaultValue: r.maintenanceType })}</Badge>
      ),
    },
    { header: t("maintenance.schedule.interval"), accessor: (r: MaintenanceScheduleData) => intervalLabel(r) },
    { header: t("maintenance.schedule.nextDue"), accessor: (r: MaintenanceScheduleData) => nextDueLabel(r) },
    {
      header: t("common.status"),
      accessor: (r: MaintenanceScheduleData) => (
        <Badge variant={statusVariant(r.status)}>{t(`maintenance.schedule.status.${r.status}`, { defaultValue: r.status })}</Badge>
      ),
    },
    {
      header: t("common.actions"),
      accessor: (r: MaintenanceScheduleData) => (
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
          <CalendarClock size={20} className="text-primary" /> {t("maintenance.schedule.title")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={16} /> {t("maintenance.schedule.newSchedule")}
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={schedules} isLoading={loading} />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setToDelete(null); }} title={t("maintenance.schedule.deleteSchedule")}>
        {toDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("maintenance.schedule.confirmDelete")}</p>
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
        title={editing ? t("maintenance.schedule.editSchedule") : t("maintenance.schedule.createSchedule")}
        className="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("maintenance.schedule.busRequiredLabel")}</label>
              <select
                required
                value={form.busId}
                onChange={(e) => setForm({ ...form, busId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenance.schedule.selectBus")}</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>{busSelectLabel(b)}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("maintenance.schedule.scheduleTitle")}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={t("maintenance.schedule.titlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.schedule.type")}</label>
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
              <label className="text-sm font-medium">{t("maintenance.schedule.intervalType")}</label>
              <select
                value={form.intervalType}
                onChange={(e) => setForm({ ...form, intervalType: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="km">{t("maintenance.schedule.intervalKm")}</option>
                <option value="months">{t("maintenance.schedule.intervalMonths")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.schedule.intervalValue")}</label>
              <input
                required
                type="number"
                min="1"
                value={form.intervalValue}
                onChange={(e) => setForm({ ...form, intervalValue: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={form.intervalType === "km" ? "5000" : "6"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.schedule.lastServiceOdometer")}</label>
              <input
                type="number"
                min="0"
                value={form.lastServiceOdometer}
                onChange={(e) => setForm({ ...form, lastServiceOdometer: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder="km"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenance.schedule.lastServiceDate")}</label>
              <input
                type="date"
                value={form.lastServiceDate}
                onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("maintenance.schedule.notes")}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                rows={2}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("common.status")}</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                  <span className="text-sm">{t("maintenance.schedule.activeSchedule")}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-emerald-500" />
                  <span className="text-sm">{t("maintenance.schedule.status.completed")}</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("maintenance.schedule.saveSchedule")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceSchedulePage;
