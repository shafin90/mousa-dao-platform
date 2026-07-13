import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Wrench, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { cityApi, type CityData } from "@/api/cityApi";
import {
  maintenanceFacilityApi,
  type MaintenanceFacilityData,
  type FacilityMaintenanceRecord,
} from "@/api/maintenanceFacilityApi";

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

const cityNameOf = (value: MaintenanceFacilityData["cityId"]): string => {
  if (value && typeof value === "object" && "name" in value) return value.name;
  return "";
};

const emptyForm = {
  name: "",
  cityId: "",
  manager: "",
  phone: "",
  capacity: "",
  address: "",
  services: "",
  notes: "",
  isActive: true,
};

const MaintenanceFacilitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const [facilities, setFacilities] = useState<MaintenanceFacilityData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceFacilityData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MaintenanceFacilityData | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const [records, setRecords] = useState<FacilityMaintenanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [viewing, setViewing] = useState<MaintenanceFacilityData | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [facilityData, cityData] = await Promise.all([
        maintenanceFacilityApi.getAll(),
        cityApi.getAll().catch(() => [] as CityData[]),
      ]);
      setFacilities(facilityData);
      setCities(cityData);
    } catch {
      toast.error(t("maintenanceFacilities.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (row: MaintenanceFacilityData) => {
    setEditing(row);
    setForm({
      name: row.name,
      cityId: idOf(row.cityId),
      manager: row.manager || "",
      phone: row.phone || "",
      capacity: row.capacity != null ? String(row.capacity) : "",
      address: row.address || "",
      services: (row.services || []).join(", "),
      notes: row.notes || "",
      isActive: row.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const openRecords = async (row: MaintenanceFacilityData) => {
    setViewing(row);
    setIsRecordsOpen(true);
    setRecordsLoading(true);
    try {
      setRecords(await maintenanceFacilityApi.getMaintenance(row._id));
    } catch {
      toast.error(t("maintenanceFacilities.recordsFailed"));
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("maintenanceFacilities.validationRequired"));
      return;
    }
    setSaving(true);
    const payload: Partial<MaintenanceFacilityData> = {
      name: form.name.trim(),
      cityId: form.cityId || null,
      manager: form.manager || "",
      phone: form.phone || "",
      capacity: form.capacity ? Number(form.capacity) : 0,
      address: form.address || "",
      services: form.services
        ? form.services.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      notes: form.notes || "",
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await maintenanceFacilityApi.update(editing._id, payload);
        toast.success(t("maintenanceFacilities.updated"));
      } else {
        await maintenanceFacilityApi.create(payload);
        toast.success(t("maintenanceFacilities.created"));
      }
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      await load();
    } catch {
      toast.error(t("maintenanceFacilities.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await maintenanceFacilityApi.delete(toDelete._id);
      toast.success(t("maintenanceFacilities.deleted"));
      setIsDeleteOpen(false);
      setToDelete(null);
      await load();
    } catch {
      toast.error(t("maintenanceFacilities.deleteFailed"));
    }
  };

  const columns = [
    { header: t("maintenanceFacilities.name"), accessor: (row: MaintenanceFacilityData) => <span className="font-medium">{row.name}</span> },
    { header: t("maintenanceFacilities.city"), accessor: (row: MaintenanceFacilityData) => cityNameOf(row.cityId) || "—" },
    { header: t("maintenanceFacilities.manager"), accessor: (row: MaintenanceFacilityData) => row.manager || "—" },
    { header: t("maintenanceFacilities.phone"), accessor: (row: MaintenanceFacilityData) => row.phone || "—" },
    { header: t("maintenanceFacilities.capacity"), accessor: (row: MaintenanceFacilityData) => (row.capacity ? String(row.capacity) : "—") },
    {
      header: t("common.status"),
      accessor: (row: MaintenanceFacilityData) => (
        <Badge variant={row.isActive !== false ? "success" : "secondary"}>
          {row.isActive !== false ? t("maintenanceFacilities.active") : t("maintenanceFacilities.inactive")}
        </Badge>
      ),
    },
    {
      header: t("maintenanceFacilities.actions"),
      accessor: (row: MaintenanceFacilityData) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openRecords(row); }}>
            <Eye size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil size={14} className="mr-1" /> {t("common.edit")}
          </Button>
          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setToDelete(row); setIsDeleteOpen(true); }}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const recordColumns = [
    { header: t("maintenanceFacilities.recordDate"), accessor: (r: FacilityMaintenanceRecord) => new Date(r.date).toLocaleDateString() },
    {
      header: t("maintenanceFacilities.recordBus"),
      accessor: (r: FacilityMaintenanceRecord) =>
        r.busId && typeof r.busId === "object" ? r.busId.busNumber || r.busId.name || "—" : "—",
    },
    { header: t("maintenanceFacilities.recordType"), accessor: (r: FacilityMaintenanceRecord) => t(`fleet.maint.${r.type}`, { defaultValue: r.type }) },
    { header: t("maintenanceFacilities.recordDescription"), accessor: (r: FacilityMaintenanceRecord) => r.description },
    { header: t("maintenanceFacilities.recordCost"), accessor: (r: FacilityMaintenanceRecord) => <span className="font-medium">CFA {(r.cost || 0).toFixed(2)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Wrench size={26} className="text-primary" /> {t("maintenanceFacilities.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("maintenanceFacilities.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={16} /> {t("maintenanceFacilities.newFacility")}
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={facilities} isLoading={loading} />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setToDelete(null); }} title={t("maintenanceFacilities.deleteFacility")}>
        {toDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("maintenanceFacilities.confirmDelete", { name: toDelete.name })}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isRecordsOpen}
        onClose={() => { setIsRecordsOpen(false); setViewing(null); setRecords([]); }}
        title={viewing ? t("maintenanceFacilities.recordsTitle", { name: viewing.name }) : t("maintenanceFacilities.records")}
        className="max-w-3xl"
      >
        <DataTable columns={recordColumns} data={records} isLoading={recordsLoading} />
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? t("maintenanceFacilities.editFacility") : t("maintenanceFacilities.createFacility")}
        className="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.nameRequired")}</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={t("maintenanceFacilities.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.city")}</label>
              <select
                value={form.cityId}
                onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenanceFacilities.noCity")}</option>
                {cities.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.capacity")}</label>
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full rounded-md border p-2"
                placeholder={t("maintenanceFacilities.capacityPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.manager")}</label>
              <input
                type="text"
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.phone")}</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.address")}</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.services")}</label>
              <input
                type="text"
                value={form.services}
                onChange={(e) => setForm({ ...form, services: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={t("maintenanceFacilities.servicesPlaceholder")}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.notes")}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                rows={2}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.statusLabel")}</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                  <span className="text-sm">{t("maintenanceFacilities.active")}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-destructive" />
                  <span className="text-sm">{t("maintenanceFacilities.inactive")}</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("maintenanceFacilities.saveFacility")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceFacilitiesPage;
