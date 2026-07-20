import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useFleet } from "../hooks/useFleet";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Pencil, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { Modal } from "@/shared/components/modals/Modal";
import { toast } from "sonner";
import { userApi } from "@/api/userApi";
import { uploadApi } from "@/api/uploadApi";
import type { BusData } from "@/api/busApi";

interface DriverOption { _id: string; profile: { firstName: string; lastName: string }; email: string }

const AMENITY_KEYS = ["WiFi", "AC", "USB Charging", "Power Outlets", "TV", "Recliner Seats", "Restroom", "Water", "GPS", "Wheelchair Access"];

const FUEL_TYPES = ["diesel", "petrol", "electric", "hybrid", "cng"];

const BUS_MAKES = [
  "Daf", "Mercedes-Benz", "Nissan", "Renault", "Yutong", "King Long",
  "Higer", "Zhongtong", "Ankai", "Iveco", "Tata", "MAN", "Setra",
  "Scania", "Temsa", "Otokar", "VDL", "Toyota", "Volvo", "Hino",
  "Mitsubishi", "Isuzu",
];

const EMPTY_FORM = {
  busNumber: "", name: "", capacity: "", type: "Standard", status: "active", assignedDriver: "",
  busManager: "", maintenanceManager: "",
  features: {} as Record<string, boolean>,
  make: "", model: "", year: "", color: "", plateNumber: "", vin: "", fuelType: "", odometer: "",
  registrationNumber: "",
  registrationExpiry: "", insuranceProvider: "", insurancePolicyNumber: "", insuranceIssueDate: "", insuranceExpiry: "", fitnessExpiry: "", lastInspectionDate: "",
  firstServiceDate: "", matriculationDate: "",
  purchaseDate: "", purchaseCost: "", homeDepot: "",
  photos: [] as string[],
};

/** Converts an ISO date string to the yyyy-mm-dd value expected by <input type="date">. */
const toDateInput = (iso?: string): string => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

const FleetPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { fleet, loading, create, update, remove, refresh } = useFleet();
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState<BusData | null>(null);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEdit = (bus: BusData) => {
    setEditingBusId(bus._id);
    setForm({
      busNumber: bus.busNumber,
      name: bus.name,
      capacity: String(bus.capacity),
      type: bus.type,
      status: bus.status || "active",
      assignedDriver: bus.assignedDriver?._id || "",
      busManager: bus.busManager?._id || "",
      maintenanceManager: bus.maintenanceManager?._id || "",
      features: (bus.features as Record<string, boolean>) || {},
      make: bus.make || "",
      model: bus.model || "",
      year: bus.year != null ? String(bus.year) : "",
      color: bus.color || "",
      plateNumber: bus.plateNumber || "",
      vin: bus.vin || "",
      fuelType: bus.fuelType || "",
      odometer: bus.odometer != null ? String(bus.odometer) : "",
      registrationNumber: bus.registrationNumber || "",
      registrationExpiry: toDateInput(bus.registrationExpiry),
      insuranceProvider: bus.insuranceProvider || "",
      insurancePolicyNumber: bus.insurancePolicyNumber || "",
      insuranceIssueDate: toDateInput(bus.insuranceIssueDate),
      insuranceExpiry: toDateInput(bus.insuranceExpiry),
      fitnessExpiry: toDateInput(bus.fitnessExpiry),
      lastInspectionDate: toDateInput(bus.lastInspectionDate),
      firstServiceDate: toDateInput(bus.firstServiceDate),
      matriculationDate: toDateInput(bus.matriculationDate),
      purchaseDate: toDateInput(bus.purchaseDate),
      purchaseCost: bus.purchaseCost != null ? String(bus.purchaseCost) : "",
      homeDepot: bus.homeDepot || "",
      photos: bus.photos && bus.photos.length ? [...bus.photos] : [],
    });
    setIsModalOpen(true);
  };

  // Auto-generate name from make + plate number
  useEffect(() => {
    const parts = [form.make, form.plateNumber].filter(Boolean);
    if (parts.length > 0) {
      setForm((prev) => ({ ...prev, name: parts.join(" ") }));
    }
  }, [form.make, form.plateNumber]);

  const openCreate = () => {
    setEditingBusId(null);
    setForm({ ...EMPTY_FORM, features: {}, photos: [] });
    setIsModalOpen(true);
  };

  const toggleAmenity = (key: string) => {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }));
  };

  const setPhoto = (idx: number, value: string) => {
    setForm((prev) => ({ ...prev, photos: prev.photos.map((p, i) => (i === idx ? value : p)) }));
  };
  const addPhoto = () => {
    setForm((prev) => {
      if (prev.photos.filter(Boolean).length >= 10) {
        toast.error(t("fleet.maxPhotos"));
        return prev;
      }
      return { ...prev, photos: [...prev.photos, ""] };
    });
  };
  const removePhoto = (idx: number) => setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = "";
    if (!files.length) return;
    const currentCount = form.photos.filter(Boolean).length;
    if (currentCount + files.length > 10) {
      toast.error(t("fleet.maxPhotos"));
      return;
    }
    setUploadingPhoto(true);
    try {
      const urls = await uploadApi.uploadImages(files);
      setForm((prev) => ({ ...prev, photos: [...prev.photos.filter(Boolean), ...urls] }));
      toast.success(t("fleet.photoUploaded", { count: urls.length }));
    } catch {
      toast.error(t("fleet.photoUploadFailed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    userApi.getAll({ role: 'driver', limit: 100 }).then(res => {
      setDrivers(res.users || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const editBusId = (location.state as { editBusId?: string } | null)?.editBusId;
    if (editBusId && fleet.length > 0) {
      const bus = fleet.find(b => b._id === editBusId);
      if (bus) openEdit(bus);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.pathname, fleet, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const num = (v: string) => (v === "" ? null : Number(v));
      const date = (v: string) => (v === "" ? null : v);
      const payload: Record<string, unknown> = {
        busNumber: form.busNumber,
        name: form.name,
        capacity: Number(form.capacity),
        type: form.type,
        status: form.status,
        features: form.features,
        assignedDriver: form.assignedDriver || null,
        busManager: form.busManager || null,
        maintenanceManager: form.maintenanceManager || null,
        make: form.make,
        model: form.model,
        year: num(form.year),
        color: form.color,
        plateNumber: form.plateNumber,
        vin: form.vin,
        fuelType: form.fuelType || null,
        odometer: num(form.odometer),
        registrationNumber: form.registrationNumber,
        registrationExpiry: date(form.registrationExpiry),
        insuranceProvider: form.insuranceProvider,
        insurancePolicyNumber: form.insurancePolicyNumber,
        insuranceIssueDate: date(form.insuranceIssueDate),
        insuranceExpiry: date(form.insuranceExpiry),
        fitnessExpiry: date(form.fitnessExpiry),
        lastInspectionDate: date(form.lastInspectionDate),
        firstServiceDate: date(form.firstServiceDate),
        matriculationDate: date(form.matriculationDate),
        purchaseDate: date(form.purchaseDate),
        purchaseCost: num(form.purchaseCost),
        homeDepot: form.homeDepot,
        photos: form.photos.map((p) => p.trim()).filter(Boolean),
      };
      if (editingBusId) {
        await update(editingBusId, payload);
        toast.success(t("fleet.updated"));
      } else {
        await create(payload);
        toast.success(t("fleet.added"));
      }
      setIsModalOpen(false);
      setEditingBusId(null);
      setForm({ ...EMPTY_FORM, features: {}, photos: [] });
    } catch { toast.error(t("fleet.saveFailed")); }
  };

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
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            openEdit(item);
          }}>
            <Pencil size={14} />
          </Button>
          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setBusToDelete(item); setIsDeleteOpen(true); }}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("fleet.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("fleet.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}><RefreshCw size={16} /> {t("common.refresh")}</Button>
          <Button size="sm" className="gap-2" onClick={openCreate}><Plus size={16} /> {t("fleet.addBus")}</Button>
        </div>
      </div>

      <DataTable columns={columns} data={fleet} isLoading={loading} onRowClick={(item) => navigate(`/fleet/${item._id}`)} />

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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBusId(null); }} title={editingBusId ? t("fleet.editBus") : t("fleet.registerNewBus")} className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.busNumber")}</label>
            <input required type="text" value={form.busNumber} onChange={e => setForm({...form, busNumber: e.target.value})} className="w-full p-2 border rounded-md" placeholder={t("fleet.busNumberPlaceholder")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.name")}</label>
            <input required type="text" value={form.name} readOnly className="w-full p-2 border rounded-md bg-muted/40 cursor-not-allowed" placeholder={t("fleet.namePlaceholder")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.type")}</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded-md bg-background">
              <option value="VIP">{t("fleet.vip")}</option>
              <option value="Premium">{t("fleet.premium")}</option>
              <option value="Mini">{t("fleet.mini")}</option>
              <option value="Standard">{t("fleet.standard")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.capacity")}</label>
            <input required type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="w-full p-2 border rounded-md" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.status")}</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 border rounded-md bg-background">
              <option value="active">{t("fleet.active")}</option>
              <option value="maintenance">{t("fleet.maintenance")}</option>
              <option value="inactive">{t("fleet.inactive")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.assignDriver")}</label>
            <select value={form.assignedDriver} onChange={e => setForm({...form, assignedDriver: e.target.value})} className="w-full p-2 border rounded-md bg-background">
              <option value="">{t("fleet.unassigned")}</option>
              {drivers.map(d => (
                <option key={d._id} value={d._id}>{d.profile?.firstName} {d.profile?.lastName} ({d.email})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.busManager")}</label>
            <select value={form.busManager} onChange={e => setForm({...form, busManager: e.target.value})} className="w-full p-2 border rounded-md bg-background">
              <option value="">{t("fleet.unassigned")}</option>
              {drivers.map(d => (
                <option key={d._id} value={d._id}>{d.profile?.firstName} {d.profile?.lastName} ({d.email})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.maintenanceManager")}</label>
            <select value={form.maintenanceManager} onChange={e => setForm({...form, maintenanceManager: e.target.value})} className="w-full p-2 border rounded-md bg-background">
              <option value="">{t("fleet.unassigned")}</option>
              {drivers.map(d => (
                <option key={d._id} value={d._id}>{d.profile?.firstName} {d.profile?.lastName} ({d.email})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fleet.amenities")}</label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITY_KEYS.map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-secondary/40">
                  <input
                    type="checkbox"
                    checked={!!form.features[key]}
                    onChange={() => toggleAmenity(key)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>{t(`fleet.amenity.${key}`, { defaultValue: key })}</span>
                </label>
              ))}
            </div>
          </div>

          <h4 className="border-t pt-4 text-sm font-semibold text-muted-foreground">{t("fleet.vehicleIdentity")}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.make")}</label>
              <select value={form.make} onChange={e => setForm({...form, make: e.target.value})} className="w-full p-2 border rounded-md bg-background">
                <option value="">{t("common.na")}</option>
                {BUS_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.model")}</label>
              <input type="text" value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="w-full p-2 border rounded-md" placeholder="Sprinter" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.year")}</label>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full p-2 border rounded-md" placeholder="2022" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.color")}</label>
              <input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full p-2 border rounded-md" placeholder="White" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.plateNumber")}</label>
              <input type="text" value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value})} className="w-full p-2 border rounded-md" placeholder="ABC-1234" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.vin")}</label>
              <input type="text" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.fuelType")}</label>
              <select value={form.fuelType} onChange={e => setForm({...form, fuelType: e.target.value})} className="w-full p-2 border rounded-md bg-background">
                <option value="">{t("common.na")}</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{t(`fleet.fuel.${f}`, { defaultValue: f })}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.odometer")}</label>
              <input type="number" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} className="w-full p-2 border rounded-md" placeholder="km" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.registrationNumber")}</label>
              <input type="text" value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
          </div>

          <h4 className="border-t pt-4 text-sm font-semibold text-muted-foreground">{t("fleet.compliance")}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.registrationExpiry")}</label>
              <input type="date" value={form.registrationExpiry} onChange={e => setForm({...form, registrationExpiry: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.fitnessExpiry")}</label>
              <input type="date" value={form.fitnessExpiry} onChange={e => setForm({...form, fitnessExpiry: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.insuranceProvider")}</label>
              <input type="text" value={form.insuranceProvider} onChange={e => setForm({...form, insuranceProvider: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.insurancePolicyNumber")}</label>
              <input type="text" value={form.insurancePolicyNumber} onChange={e => setForm({...form, insurancePolicyNumber: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.insuranceIssueDate")}</label>
              <input type="date" value={form.insuranceIssueDate} onChange={e => setForm({...form, insuranceIssueDate: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.insuranceExpiry")}</label>
              <input type="date" value={form.insuranceExpiry} onChange={e => setForm({...form, insuranceExpiry: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.lastInspectionDate")}</label>
              <input type="date" value={form.lastInspectionDate} onChange={e => setForm({...form, lastInspectionDate: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
          </div>

          <h4 className="border-t pt-4 text-sm font-semibold text-muted-foreground">{t("fleet.serviceInfo", "Service & Registration")}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.firstServiceDate")}</label>
              <input type="date" value={form.firstServiceDate} onChange={e => setForm({...form, firstServiceDate: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.matriculationDate")}</label>
              <input type="date" value={form.matriculationDate} onChange={e => setForm({...form, matriculationDate: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
          </div>

          <h4 className="border-t pt-4 text-sm font-semibold text-muted-foreground">{t("fleet.purchaseInfo")}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.purchaseDate")}</label>
              <input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fleet.purchaseCost")}</label>
              <input type="number" value={form.purchaseCost} onChange={e => setForm({...form, purchaseCost: e.target.value})} className="w-full p-2 border rounded-md" placeholder="CFA" />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">{t("fleet.homeDepot")}</label>
              <input type="text" value={form.homeDepot} onChange={e => setForm({...form, homeDepot: e.target.value})} className="w-full p-2 border rounded-md" placeholder={t("fleet.homeDepotPlaceholder")} />
            </div>
          </div>

            <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">{t("fleet.photos")}</label>
                <p className="text-xs text-muted-foreground">{form.photos.filter(Boolean).length}/10</p>
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploadingPhoto || form.photos.filter(Boolean).length >= 10} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} className="mr-1" />{uploadingPhoto ? t("fleet.uploading") : t("fleet.uploadPhoto")}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={form.photos.filter(Boolean).length >= 10} onClick={addPhoto}><Plus size={14} className="mr-1" />{t("fleet.addPhotoUrl")}</Button>
              </div>
            </div>

            {form.photos.filter(Boolean).length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.photos.map((url, idx) => (url ? (
                  <div key={`thumb-${idx}`} className="group relative aspect-video overflow-hidden rounded-md border bg-muted">
                    <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }} />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : null))}
              </div>
            )}

            {form.photos.length === 0 && <p className="text-xs text-muted-foreground">{t("fleet.noPhotos")}</p>}

            {form.photos.map((url, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="url" value={url} onChange={e => setPhoto(idx, e.target.value)} className="w-full p-2 border rounded-md" placeholder="https://..." />
                <Button type="button" variant="destructive" size="sm" onClick={() => removePhoto(idx)}><Trash2 size={14} /></Button>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit">{editingBusId ? t("common.update") : t("fleet.addBus")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default FleetPage;
