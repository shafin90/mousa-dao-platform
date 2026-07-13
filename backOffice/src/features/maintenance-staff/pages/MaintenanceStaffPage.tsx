import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { maintenanceStaffApi, type MaintenanceStaffData } from "@/api/maintenanceStaffApi";
import { maintenanceFacilityApi, type MaintenanceFacilityData } from "@/api/maintenanceFacilityApi";

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

const facilityNameOf = (value: MaintenanceStaffData["facilityId"]): string => {
  if (value && typeof value === "object" && "name" in value) return value.name;
  return "";
};

const emptyForm = {
  name: "",
  role: "",
  phone: "",
  facilityId: "",
  isActive: true,
};

const MaintenanceStaffPage: React.FC = () => {
  const { t } = useTranslation();
  const [staff, setStaff] = useState<MaintenanceStaffData[]>([]);
  const [facilities, setFacilities] = useState<MaintenanceFacilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceStaffData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MaintenanceStaffData | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    setLoading(true);
    try {
      const [staffData, facilityData] = await Promise.all([
        maintenanceStaffApi.getAll(),
        maintenanceFacilityApi.getAll().catch(() => [] as MaintenanceFacilityData[]),
      ]);
      setStaff(staffData);
      setFacilities(facilityData);
    } catch {
      toast.error(t("maintenanceStaff.loadFailed"));
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

  const openEdit = (row: MaintenanceStaffData) => {
    setEditing(row);
    setForm({
      name: row.name,
      role: row.role || "",
      phone: row.phone || "",
      facilityId: idOf(row.facilityId),
      isActive: row.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("maintenanceStaff.validationRequired"));
      return;
    }
    setSaving(true);
    const payload: Partial<MaintenanceStaffData> = {
      name: form.name.trim(),
      role: form.role || "",
      phone: form.phone || "",
      facilityId: form.facilityId || null,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await maintenanceStaffApi.update(editing._id, payload);
        toast.success(t("maintenanceStaff.updated"));
      } else {
        await maintenanceStaffApi.create(payload);
        toast.success(t("maintenanceStaff.created"));
      }
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      await load();
    } catch {
      toast.error(t("maintenanceStaff.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await maintenanceStaffApi.delete(toDelete._id);
      toast.success(t("maintenanceStaff.deleted"));
      setIsDeleteOpen(false);
      setToDelete(null);
      await load();
    } catch {
      toast.error(t("maintenanceStaff.deleteFailed"));
    }
  };

  const columns = [
    { header: t("maintenanceStaff.name"), accessor: (row: MaintenanceStaffData) => <span className="font-medium">{row.name}</span> },
    { header: t("maintenanceStaff.role"), accessor: (row: MaintenanceStaffData) => row.role || "—" },
    { header: t("maintenanceStaff.phone"), accessor: (row: MaintenanceStaffData) => row.phone || "—" },
    { header: t("maintenanceStaff.facility"), accessor: (row: MaintenanceStaffData) => facilityNameOf(row.facilityId) || "—" },
    {
      header: t("common.status"),
      accessor: (row: MaintenanceStaffData) => (
        <Badge variant={row.isActive !== false ? "success" : "secondary"}>
          {row.isActive !== false ? t("maintenanceStaff.active") : t("maintenanceStaff.inactive")}
        </Badge>
      ),
    },
    {
      header: t("maintenanceStaff.actions"),
      accessor: (row: MaintenanceStaffData) => (
        <div className="flex gap-1">
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Users size={26} className="text-primary" /> {t("maintenanceStaff.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("maintenanceStaff.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={16} /> {t("maintenanceStaff.newStaff")}
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={staff} isLoading={loading} />

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setToDelete(null); }} title={t("maintenanceStaff.deleteStaff")}>
        {toDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("maintenanceStaff.confirmDelete", { name: toDelete.name })}</p>
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
        title={editing ? t("maintenanceStaff.editStaff") : t("maintenanceStaff.createStaff")}
        className="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceStaff.nameRequired")}</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={t("maintenanceStaff.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceStaff.role")}</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
                placeholder={t("maintenanceStaff.rolePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("maintenanceStaff.phone")}</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border bg-muted/30 p-2"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceStaff.facility")}</label>
              <select
                value={form.facilityId}
                onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenanceStaff.noFacility")}</option>
                {facilities.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceStaff.statusLabel")}</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                  <span className="text-sm">{t("maintenanceStaff.active")}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-destructive" />
                  <span className="text-sm">{t("maintenanceStaff.inactive")}</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("maintenanceStaff.saveStaff")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceStaffPage;
