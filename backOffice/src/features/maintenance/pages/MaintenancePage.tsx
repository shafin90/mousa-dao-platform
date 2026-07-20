import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Wrench, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { maintenanceRecordApi, type MaintenanceRecord, type MaintenancePayload } from "@/api/maintenanceRecordApi";
import { busApi, type BusData } from "@/api/busApi";
import { maintenanceFacilityApi, type MaintenanceFacilityData } from "@/api/maintenanceFacilityApi";

const TYPES = ["routine", "repair", "inspection", "other"] as const;

const busLabelOf = (value: MaintenanceRecord["busId"]): string => {
  if (value && typeof value === "object") return value.busNumber || value.name || "—";
  return "—";
};

const facilityNameOf = (value: MaintenanceRecord["facilityId"]): string => {
  if (value && typeof value === "object" && "name" in value) return value.name;
  return "";
};

const facilityAddressOf = (value: MaintenanceRecord["facilityId"]): string => {
  if (value && typeof value === "object" && "address" in value) return value.address || "";
  return "";
};

const busSelectLabel = (b: BusData): string => {
  const number = b.busNumber || "";
  const name = b.name || "";
  if (number && name && number !== name) return `${number} · ${name}`;
  return number || name || b._id;
};

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

const emptyForm = {
  busId: "",
  facilityId: "",
  date: "",
  type: "other" as string,
  description: "",
  cost: "",
  performedBy: "",
};

const MaintenancePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [facilities, setFacilities] = useState<MaintenanceFacilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    setLoading(true);
    try {
      const data = await maintenanceRecordApi.getAll();
      setRecords(data);
    } catch {
      toast.error(t("maintenanceRecords.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    busApi.getAll({ limit: 1000 }).then((res) => setBuses(res.buses)).catch(() => setBuses([]));
    maintenanceFacilityApi.getAll().then(setFacilities).catch(() => setFacilities([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (row: MaintenanceRecord) => {
    setEditing(row);
    setForm({
      busId: idOf(row.busId),
      facilityId: idOf(row.facilityId),
      date: row.date ? row.date.slice(0, 10) : "",
      type: row.type || "other",
      description: row.description || "",
      cost: row.cost != null ? String(row.cost) : "",
      performedBy: row.performedBy || "",

    });
    setIsModalOpen(true);
  };

  const buildPayload = (): MaintenancePayload => ({
    busId: form.busId,
    facilityId: form.facilityId || null,
    date: form.date,
    type: form.type,
    description: form.description,
    cost: form.cost ? Number(form.cost) : 0,
    performedBy: form.performedBy || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.busId) { toast.error(t("maintenanceRecords.busRequired")); return; }
    if (!form.date) { toast.error(t("maintenanceRecords.dateRequired")); return; }
    if (!form.description) { toast.error(t("maintenanceRecords.descriptionRequired")); return; }
    setSaving(true);
    try {
      if (editing) {
        await maintenanceRecordApi.update(editing._id, buildPayload());
        toast.success(t("maintenanceRecords.updated"));
      } else {
        await maintenanceRecordApi.create(buildPayload());
        toast.success(t("maintenanceRecords.created"));
      }
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      await load();
    } catch {
      toast.error(t("maintenanceRecords.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await maintenanceRecordApi.delete(toDelete._id);
      toast.success(t("maintenanceRecords.deleted"));
      setIsDeleteOpen(false);
      setToDelete(null);
      await load();
    } catch {
      toast.error(t("maintenanceRecords.deleteFailed"));
    }
  };

  const columns = [
    { header: t("maintenanceRecords.date"), accessor: (r: MaintenanceRecord) => new Date(r.date).toLocaleDateString() },
    { header: t("maintenanceRecords.bus"), accessor: (r: MaintenanceRecord) => busLabelOf(r.busId) },
    {
      header: t("maintenanceRecords.type"),
      accessor: (r: MaintenanceRecord) => (
        <Badge variant="outline">{t(`maintenance.type.${r.type}`, { defaultValue: r.type })}</Badge>
      ),
    },
    { header: t("maintenanceRecords.description"), accessor: (r: MaintenanceRecord) => r.description },
    { header: t("maintenanceRecords.facility"), accessor: (r: MaintenanceRecord) => facilityNameOf(r.facilityId) || "—" },
    { header: t("maintenanceRecords.location"), accessor: (r: MaintenanceRecord) => facilityAddressOf(r.facilityId) || "—" },
    {
      header: t("common.actions"),
      accessor: (r: MaintenanceRecord) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
            <Pencil size={14} />
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Wrench size={26} className="text-primary" /> {t("maintenanceRecords.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("maintenanceRecords.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={16} /> {t("maintenanceRecords.newRecord")}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={records}
        isLoading={loading}
        onRowClick={(row) => navigate(`/maintenance-records/${row._id}`)}
      />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setToDelete(null); }} title={t("maintenanceRecords.deleteRecord")}>
        {toDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("maintenanceRecords.confirmDelete")}</p>
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
        title={editing ? t("maintenanceRecords.editRecord") : t("maintenanceRecords.createRecord")}
        className="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("maintenanceRecords.busRequiredLabel")}</label>
              <select
                required
                value={form.busId}
                onChange={(e) => setForm({ ...form, busId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenanceRecords.selectBus")}</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>{busSelectLabel(b)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceRecords.date")}</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceRecords.type")}</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                {TYPES.map((ty) => (
                  <option key={ty} value={ty}>{t(`maintenance.type.${ty}`, { defaultValue: ty })}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceRecords.facility")}</label>
              <select
                value={form.facilityId}
                onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenanceRecords.noFacility")}</option>
                {facilities.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceRecords.performedBy")}</label>
              <input
                type="text"
                value={form.performedBy}
                onChange={(e) => setForm({ ...form, performedBy: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={t("maintenanceRecords.performedByPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceRecords.cost")}</label>
              <input
                type="number"
                min="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder="CFA"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("maintenanceRecords.description")}</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                rows={3}
                placeholder={t("maintenanceRecords.descriptionPlaceholder")}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("maintenanceRecords.saveRecord")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenancePage;
