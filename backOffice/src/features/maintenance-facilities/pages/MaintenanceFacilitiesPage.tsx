import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Wrench, Pencil, Trash2, Eye, Send } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { cityApi, type CityData } from "@/api/cityApi";
import { busApi, type BusData } from "@/api/busApi";
import {
  maintenanceFacilityApi,
  type MaintenanceFacilityData,
  type FacilityMaintenanceRecord,
} from "@/api/maintenanceFacilityApi";
import { maintenanceStaffApi, type MaintenanceStaffData } from "@/api/maintenanceStaffApi";
import { DEFAULT_MAINTENANCE_SERVICES } from "@/shared/constants/maintenance";

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

const sendEmptyForm = {
  busId: "",
  facilityId: "",
  date: new Date().toISOString().slice(0, 10),
  type: "routine",
  description: "",
  cost: "",
  odometer: "",
  performedBy: "",
  nextServiceDate: "",
};

const busLabel = (b: BusData): string => {
  const number = b.busNumber ? b.busNumber : "";
  const name = b.name ? b.name : "";
  if (number && name && number !== name) return `${number} · ${name}`;
  return number || name || b._id;
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

  const [buses, setBuses] = useState<BusData[]>([]);
  const [staff, setStaff] = useState<MaintenanceStaffData[]>([]);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sendSaving, setSendSaving] = useState(false);
  const [sendForm, setSendForm] = useState({ ...sendEmptyForm });

  const load = async () => {
    setLoading(true);
    try {
      const [facilityData, cityData, busData, staffData] = await Promise.all([
        maintenanceFacilityApi.getAll(),
        cityApi.getAll().catch(() => [] as CityData[]),
        busApi.getAll({ limit: 1000 }).catch(() => ({ buses: [] as BusData[], total: 0 })),
        maintenanceStaffApi.getAll().catch(() => [] as MaintenanceStaffData[]),
      ]);
      setFacilities(facilityData);
      setCities(cityData);
      setBuses(busData.buses);
      setStaff(staffData);
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

  const openSend = (facility?: MaintenanceFacilityData) => {
    setSendForm({
      ...sendEmptyForm,
      facilityId: facility ? facility._id : "",
      date: new Date().toISOString().slice(0, 10),
    });
    setIsSendOpen(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.busId) {
      toast.error(t("maintenanceFacilities.sendBusRequired"));
      return;
    }
    if (!sendForm.description.trim()) {
      toast.error(t("maintenanceFacilities.sendDescRequired"));
      return;
    }
    setSendSaving(true);
    try {
      await busApi.addMaintenanceLog(sendForm.busId, {
        date: sendForm.date,
        type: sendForm.type,
        description: sendForm.description.trim(),
        cost: sendForm.cost ? Number(sendForm.cost) : 0,
        odometer: sendForm.odometer ? Number(sendForm.odometer) : undefined,
        performedBy: sendForm.performedBy || undefined,
        nextServiceDate: sendForm.nextServiceDate || undefined,
        facilityId: sendForm.facilityId || undefined,
      });
      toast.success(t("maintenanceFacilities.sendSuccess"));
      setIsSendOpen(false);
      setSendForm({ ...sendEmptyForm });
      if (isRecordsOpen && viewing && viewing._id === sendForm.facilityId) {
        setRecordsLoading(true);
        try {
          setRecords(await maintenanceFacilityApi.getMaintenance(viewing._id));
        } finally {
          setRecordsLoading(false);
        }
      }
    } catch {
      toast.error(t("maintenanceFacilities.sendFailed"));
    } finally {
      setSendSaving(false);
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
          <Button variant="ghost" size="sm" title={t("maintenanceFacilities.sendToMaintenance")} onClick={(e) => { e.stopPropagation(); openSend(row); }}>
            <Send size={16} />
          </Button>
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

  const staffIdOf = (value: MaintenanceStaffData["facilityId"]): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && "_id" in value) return String(value._id);
    return "";
  };
  const activeStaff = staff.filter((s) => s.isActive !== false);
  const sendStaffOptions = sendForm.facilityId
    ? activeStaff.filter((s) => {
        const fid = staffIdOf(s.facilityId);
        return !fid || fid === sendForm.facilityId;
      })
    : activeStaff;

  const sendSelectedFacility = facilities.find((f) => f._id === sendForm.facilityId);
  const sendServiceOptions =
    sendSelectedFacility && sendSelectedFacility.services && sendSelectedFacility.services.length > 0
      ? sendSelectedFacility.services.map((s) => ({ value: s, label: s }))
      : DEFAULT_MAINTENANCE_SERVICES.map((s) => ({
          value: s.value,
          label: t(`fleet.serviceOption.${s.key}`, { defaultValue: s.value }),
        }));

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
          <Button variant="outline" size="sm" className="gap-2" onClick={() => openSend()}>
            <Send size={16} /> {t("maintenanceFacilities.sendToMaintenance")}
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
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        title={t("maintenanceFacilities.sendTitle")}
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <form className="space-y-4" onSubmit={handleSend}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.sendBus")}</label>
              <select
                required
                value={sendForm.busId}
                onChange={(e) => setSendForm({ ...sendForm, busId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenanceFacilities.sendBusPlaceholder")}</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>{busLabel(b)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("maintenanceFacilities.sendFacility")}</label>
              <select
                value={sendForm.facilityId}
                onChange={(e) => setSendForm({ ...sendForm, facilityId: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("maintenanceFacilities.sendNoFacility")}</option>
                {facilities.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.maintDate")}</label>
              <input required type="date" value={sendForm.date} onChange={(e) => setSendForm({ ...sendForm, date: e.target.value })} className="w-full rounded-md border p-2" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.maintType")}</label>
              <select value={sendForm.type} onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })} className="w-full rounded-md border bg-background p-2">
                {["routine", "repair", "inspection", "other"].map((ty) => (
                  <option key={ty} value={ty}>{t(`fleet.maint.${ty}`, { defaultValue: ty })}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("fleet.maintDescription")}</label>
              <select
                required
                value={sendForm.description}
                onChange={(e) => setSendForm({ ...sendForm, description: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("fleet.selectService", { defaultValue: "Select a service" })}</option>
                {sendServiceOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                {sendForm.description && !sendServiceOptions.some((o) => o.value === sendForm.description) && (
                  <option value={sendForm.description}>{sendForm.description}</option>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.maintCost")}</label>
              <input type="number" min="0" value={sendForm.cost} onChange={(e) => setSendForm({ ...sendForm, cost: e.target.value })} className="w-full rounded-md border p-2" placeholder="CFA" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.odometer")}</label>
              <input type="number" value={sendForm.odometer} onChange={(e) => setSendForm({ ...sendForm, odometer: e.target.value })} className="w-full rounded-md border p-2" placeholder="km" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.maintBy")}</label>
              <select
                value={sendForm.performedBy}
                onChange={(e) => setSendForm({ ...sendForm, performedBy: e.target.value })}
                className="w-full rounded-md border bg-background p-2"
              >
                <option value="">{t("fleet.selectPerformer", { defaultValue: "Not specified" })}</option>
                {sendStaffOptions.map((s) => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
                {sendForm.performedBy && !sendStaffOptions.some((s) => s.name === sendForm.performedBy) && (
                  <option value={sendForm.performedBy}>{sendForm.performedBy}</option>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.nextServiceDate")}</label>
              <input type="date" value={sendForm.nextServiceDate} onChange={(e) => setSendForm({ ...sendForm, nextServiceDate: e.target.value })} className="w-full rounded-md border p-2" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsSendOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={sendSaving}>{sendSaving ? t("common.saving") : t("maintenanceFacilities.sendSubmit")}</Button>
          </div>
        </form>
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
