import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bus,
  Save,
  X,
  Upload,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { busApi } from "@/api/busApi";
import { userApi } from "@/api/userApi";
import { uploadApi } from "@/api/uploadApi";

interface DriverOption { _id: string; profile: { firstName: string; lastName: string }; email: string }

const AMENITY_KEYS = ["WiFi", "AC", "USB Charging", "Power Outlets", "TV", "Recliner Seats", "Restroom", "Water", "GPS", "Wheelchair Access"];

const FUEL_TYPES = ["diesel", "petrol", "electric", "hybrid", "cng"];

const BUS_MAKES = [
  "Daf", "Mercedes-Benz", "Nissan", "Renault", "Yutong", "King Long",
  "Higer", "Zhongtong", "Ankai", "Iveco", "Tata", "MAN", "Setra",
  "Scania", "Temsa", "Otokar", "VDL", "Toyota", "Volvo", "Hino",
  "Mitsubishi", "Isuzu",
];

interface FleetForm {
  busNumber: string;
  name: string;
  capacity: string;
  type: string;
  status: string;
  assignedDriver: string;
  busManager: string;
  maintenanceManager: string;
  features: Record<string, boolean>;
  make: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  vin: string;
  fuelType: string;
  odometer: string;
  registrationNumber: string;
  registrationExpiry: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceIssueDate: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  lastInspectionDate: string;
  firstServiceDate: string;
  matriculationDate: string;
  purchaseDate: string;
  purchaseCost: string;
  homeDepot: string;
  seatRows: string;
  leftSeats: string;
  rightSeats: string;
  photos: string[];
}

const EMPTY_FORM: FleetForm = {
  busNumber: "", name: "", capacity: "", type: "Standard", status: "active",
  assignedDriver: "", busManager: "", maintenanceManager: "",
  features: {},
  make: "", model: "", year: "", color: "", plateNumber: "", vin: "", fuelType: "", odometer: "",
  registrationNumber: "", registrationExpiry: "",
  insuranceProvider: "", insurancePolicyNumber: "", insuranceIssueDate: "", insuranceExpiry: "",
  fitnessExpiry: "", lastInspectionDate: "",
  firstServiceDate: "", matriculationDate: "",
  purchaseDate: "", purchaseCost: "", homeDepot: "",
  seatRows: "5", leftSeats: "2", rightSeats: "2",
  photos: [],
};

const FleetCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useErrorModal();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FleetForm>({ ...EMPTY_FORM, features: {}, photos: [] });
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userApi.getAll({ role: 'driver', limit: 100 }).then(res => {
      setDrivers(res.users || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const parts = [form.make, form.plateNumber].filter(Boolean);
    if (parts.length > 0) {
      setForm((prev) => ({ ...prev, name: parts.join(" ") }));
    }
  }, [form.make, form.plateNumber]);

  const toggleAmenity = (key: string) => {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }));
  };

  const setPhoto = (idx: number, value: string) => {
    setForm((prev) => ({ ...prev, photos: prev.photos.map((p, i) => (i === idx ? value : p)) }));
  };

  const addPhoto = () => {
    setForm((prev) => {
      if (prev.photos.filter(Boolean).length >= 10) {
        showError(t("fleet.maxPhotos"));
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
      showError(t("fleet.maxPhotos"));
      return;
    }
    setUploadingPhoto(true);
    try {
      const urls = await uploadApi.uploadImages(files);
      setForm((prev) => ({ ...prev, photos: [...prev.photos.filter(Boolean), ...urls] }));
      toast.success(t("fleet.photoUploaded", { count: urls.length }));
    } catch {
      showError(t("fleet.photoUploadFailed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
        seatRows: form.seatRows ? Number(form.seatRows) : null,
        leftSeats: form.leftSeats ? Number(form.leftSeats) : null,
        rightSeats: form.rightSeats ? Number(form.rightSeats) : null,
        photos: form.photos.map((p) => p.trim()).filter(Boolean),
      };
      const created = await busApi.create(payload);
      toast.success(t("fleet.added"));
      navigate(`/fleet/${created._id}`);
    } catch {
      showError(t("fleet.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; required?: boolean } = {}
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">
        {label}{opts.required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={opts.type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts.placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/fleet")}>
            <ArrowLeft size={16} /> {t("fleet.backToFleet")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bus size={22} className="text-primary" />
            {t("fleet.registerNewBus")}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bus size={18} className="text-primary" /> {t("fleet.vehicleInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {renderInput(t("fleet.busNumber"), form.busNumber, (v) => setForm({ ...form, busNumber: v }), { required: true, placeholder: t("fleet.busNumberPlaceholder") })}
              {renderInput(t("fleet.name"), form.name, (v) => setForm({ ...form, name: v }), { required: true, placeholder: t("fleet.namePlaceholder") })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("fleet.type")}</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="VIP">{t("fleet.vip")}</option>
                  <option value="Premium">{t("fleet.premium")}</option>
                  <option value="Mini">{t("fleet.mini")}</option>
                  <option value="Standard">{t("fleet.standard")}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("fleet.capacity")}<span className="text-destructive">*</span></label>
                <input required type="number" value={form.capacity} onChange={e => {
                  const cap = Math.max(1, Number(e.target.value));
                  setForm((prev) => {
                    const l = prev.leftSeats ? Number(prev.leftSeats) : 2;
                    const r = prev.rightSeats ? Number(prev.rightSeats) : 2;
                    const total = l + r || 1;
                    return { ...prev, capacity: String(cap), seatRows: String(Math.max(1, Math.ceil(cap / total))) };
                  });
                }} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {renderInput(t("fleet.rows"), form.seatRows, (v) => {
                const rows = Math.max(1, Number(v) || 1);
                setForm((prev) => {
                  const cap = Number(prev.capacity) || 1;
                  const perRow = Math.max(1, Math.ceil(cap / rows));
                  return { ...prev, seatRows: String(rows), leftSeats: String(Math.ceil(perRow / 2)), rightSeats: String(Math.floor(perRow / 2)) };
                });
              }, { type: "number" })}
              {renderInput("Left column", form.leftSeats, (v) => {
                const left = Math.max(0, Number(v) || 0);
                setForm((prev) => {
                  const r = prev.rightSeats ? Number(prev.rightSeats) : 2;
                  const perRow = left + r || 1;
                  const cap = Number(prev.capacity) || 1;
                  return { ...prev, leftSeats: String(left), seatRows: String(Math.max(1, Math.ceil(cap / perRow))) };
                });
              }, { type: "number" })}
              {renderInput("Right column", form.rightSeats, (v) => {
                const right = Math.max(0, Number(v) || 0);
                setForm((prev) => {
                  const l = prev.leftSeats ? Number(prev.leftSeats) : 2;
                  const perRow = l + right || 1;
                  const cap = Number(prev.capacity) || 1;
                  return { ...prev, rightSeats: String(right), seatRows: String(Math.max(1, Math.ceil(cap / perRow))) };
                });
              }, { type: "number" })}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">{t("fleet.status")}</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="active">{t("fleet.active")}</option>
                <option value="maintenance">{t("fleet.maintenance")}</option>
                <option value="inactive">{t("fleet.inactive")}</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("fleet.assignedDriver")}</label>
                <select value={form.assignedDriver} onChange={e => setForm({...form, assignedDriver: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">{t("fleet.unassigned")}</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.profile?.firstName} {d.profile?.lastName} ({d.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("fleet.busManager")}</label>
                <select value={form.busManager} onChange={e => setForm({...form, busManager: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">{t("fleet.unassigned")}</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.profile?.firstName} {d.profile?.lastName} ({d.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("fleet.maintenanceManager")}</label>
                <select value={form.maintenanceManager} onChange={e => setForm({...form, maintenanceManager: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">{t("fleet.unassigned")}</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.profile?.firstName} {d.profile?.lastName} ({d.email})</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus size={18} className="text-primary" /> {t("fleet.amenities")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITY_KEYS.map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-secondary/40">
                  <input type="checkbox" checked={!!form.features[key]} onChange={() => toggleAmenity(key)} className="h-4 w-4 rounded border-input" />
                  <span>{t(`fleet.amenity.${key}`, { defaultValue: key })}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bus size={18} className="text-primary" /> {t("fleet.vehicleIdentity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("fleet.make")}</label>
                <select value={form.make} onChange={e => setForm({...form, make: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">{t("common.na")}</option>
                  {BUS_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {renderInput(t("fleet.model"), form.model, (v) => setForm({...form, model: v}), { placeholder: "Sprinter" })}
              {renderInput(t("fleet.year"), form.year, (v) => setForm({...form, year: v}), { type: "number", placeholder: "2022" })}
              {renderInput(t("fleet.color"), form.color, (v) => setForm({...form, color: v}), { placeholder: "White" })}
              {renderInput(t("fleet.plateNumber"), form.plateNumber, (v) => setForm({...form, plateNumber: v}), { placeholder: "ABC-1234" })}
              {renderInput(t("fleet.vin"), form.vin, (v) => setForm({...form, vin: v}))}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("fleet.fuelType")}</label>
                <select value={form.fuelType} onChange={e => setForm({...form, fuelType: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">{t("common.na")}</option>
                  {FUEL_TYPES.map(f => <option key={f} value={f}>{t(`fleet.fuel.${f}`, { defaultValue: f })}</option>)}
                </select>
              </div>
              {renderInput(t("fleet.odometer"), form.odometer, (v) => setForm({...form, odometer: v}), { type: "number", placeholder: "km" })}
              {renderInput(t("fleet.registrationNumber"), form.registrationNumber, (v) => setForm({...form, registrationNumber: v}))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload size={18} className="text-primary" /> {t("fleet.compliance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {renderInput(t("fleet.registrationExpiry"), form.registrationExpiry, (v) => setForm({...form, registrationExpiry: v}), { type: "date" })}
              {renderInput(t("fleet.fitnessExpiry"), form.fitnessExpiry, (v) => setForm({...form, fitnessExpiry: v}), { type: "date" })}
              {renderInput(t("fleet.insuranceProvider"), form.insuranceProvider, (v) => setForm({...form, insuranceProvider: v}))}
              {renderInput(t("fleet.insurancePolicyNumber"), form.insurancePolicyNumber, (v) => setForm({...form, insurancePolicyNumber: v}))}
              {renderInput(t("fleet.insuranceIssueDate"), form.insuranceIssueDate, (v) => setForm({...form, insuranceIssueDate: v}), { type: "date" })}
              {renderInput(t("fleet.insuranceExpiry"), form.insuranceExpiry, (v) => setForm({...form, insuranceExpiry: v}), { type: "date" })}
              {renderInput(t("fleet.lastInspectionDate"), form.lastInspectionDate, (v) => setForm({...form, lastInspectionDate: v}), { type: "date" })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload size={18} className="text-primary" /> {t("fleet.serviceInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {renderInput(t("fleet.firstServiceDate"), form.firstServiceDate, (v) => setForm({...form, firstServiceDate: v}), { type: "date" })}
              {renderInput(t("fleet.matriculationDate"), form.matriculationDate, (v) => setForm({...form, matriculationDate: v}), { type: "date" })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload size={18} className="text-primary" /> {t("fleet.purchaseInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {renderInput(t("fleet.purchaseDate"), form.purchaseDate, (v) => setForm({...form, purchaseDate: v}), { type: "date" })}
              {renderInput(t("fleet.purchaseCost"), form.purchaseCost, (v) => setForm({...form, purchaseCost: v}), { type: "number", placeholder: "CFA" })}
              {renderInput(t("fleet.homeDepot"), form.homeDepot, (v) => setForm({...form, homeDepot: v}), { placeholder: t("fleet.homeDepotPlaceholder") })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload size={18} className="text-primary" /> {t("fleet.photos")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{form.photos.filter(Boolean).length}/10</p>
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                <Button type="button" variant="outline" size="sm" disabled={uploadingPhoto || form.photos.filter(Boolean).length >= 10} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} className="mr-1" />{uploadingPhoto ? t("fleet.uploading") : t("fleet.uploadPhoto")}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={form.photos.filter(Boolean).length >= 10} onClick={addPhoto}>
                  <Plus size={14} className="mr-1" />{t("fleet.addPhotoUrl")}
                </Button>
              </div>
            </div>
            {form.photos.filter(Boolean).length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.photos.map((url, idx) => (url ? (
                  <div key={`thumb-${idx}`} className="group relative aspect-video overflow-hidden rounded-md border bg-muted">
                    <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }} />
                    <button type="button" onClick={() => removePhoto(idx)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition group-hover:opacity-100" aria-label={t("common.delete")}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : null))}
              </div>
            )}
            {form.photos.length === 0 && <p className="text-xs text-muted-foreground">{t("fleet.noPhotos")}</p>}
            {form.photos.map((url, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="url" value={url} onChange={e => setPhoto(idx, e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1" placeholder="https://..." />
                <Button type="button" variant="destructive" size="sm" onClick={() => removePhoto(idx)}><Trash2 size={14} /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("/fleet")}>
            <X size={16} /> {t("common.cancel")}
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save size={16} /> {saving ? t("common.saving") : t("fleet.addBus")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FleetCreatePage;
