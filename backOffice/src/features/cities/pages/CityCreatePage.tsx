import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Save,
  X,
  Phone,
  Mail,
  User as UserIcon,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { cityApi } from "@/api/cityApi";
import { userApi } from "@/api/userApi";
import type { User } from "@/shared/types";

const COUNTRIES = [
  "C\u00f4te d'Ivoire", "Benin", "Burkina Faso", "Mali", "Togo",
  "Nigeria", "Ghana", "Guinee Conakry", "Senegal", "Niger",
] as const;

interface CityForm {
  name: string;
  country: string;
  address1: string;
  address2: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  manager1: string;
  manager2: string;
  lat: string;
  lng: string;
  isActive: boolean;
}

const EMPTY_FORM: CityForm = {
  name: "", country: "", address1: "", address2: "",
  phone1: "", phone2: "", email1: "", email2: "",
  manager1: "", manager2: "", lat: "", lng: "", isActive: true,
};

function getUserName(u: User): string {
  return `${u.profile.firstName} ${u.profile.lastName}`;
}

const CityCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useErrorModal();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CityForm>({ ...EMPTY_FORM });
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    userApi.getAll({ limit: 1000 }).then((res) => setUsers(res.users.filter((u) => u.role !== "customer"))).catch(() => setUsers([]));
  }, []);

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; required?: boolean; icon?: React.ReactNode } = {}
  ) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {opts.icon && <span className="shrink-0">{opts.icon}</span>}
        {label}{opts.required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={opts.type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts.placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.country) {
      showError(t("cities.validationRequired"));
      return;
    }
    setSaving(true);
    try {
      const created = await cityApi.create({
        name: form.name,
        country: form.country,
        address1: form.address1 || undefined,
        address2: form.address2 || undefined,
        phone1: form.phone1 || undefined,
        phone2: form.phone2 || undefined,
        email1: form.email1 || undefined,
        email2: form.email2 || undefined,
        manager1: form.manager1 || undefined,
        manager2: form.manager2 || undefined,
        location: form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined,
        isActive: form.isActive,
      });
      toast.success(t("cities.created"));
      navigate(`/cities/${created._id}`);
    } catch {
      showError(t("cities.createFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/cities")}>
            <ArrowLeft size={16} /> {t("cities.backToCities")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Building2 size={22} className="text-primary" />
            {t("cities.createCity")}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe size={18} className="text-primary" /> {t("cities.cityName")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderInput(t("cities.cityName"), form.name, (v) => setForm({ ...form, name: v }), { required: true, icon: <Building2 size={14} />, placeholder: t("cities.cityNamePlaceholder") })}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Globe size={14} /> {t("cities.country")}<span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t("cities.selectCountry")}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={18} className="text-primary" /> {t("cities.addressInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderInput(t("cities.address1"), form.address1, (v) => setForm({ ...form, address1: v }), { icon: <MapPin size={14} /> })}
                {renderInput(t("cities.address2"), form.address2, (v) => setForm({ ...form, address2: v }), { icon: <MapPin size={14} /> })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone size={18} className="text-primary" /> {t("cities.contactInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderInput(t("cities.phone1"), form.phone1, (v) => setForm({ ...form, phone1: v }), { type: "tel", icon: <Phone size={14} /> })}
                {renderInput(t("cities.phone2"), form.phone2, (v) => setForm({ ...form, phone2: v }), { type: "tel", icon: <Phone size={14} /> })}
                {renderInput(t("cities.email1"), form.email1, (v) => setForm({ ...form, email1: v }), { type: "email", icon: <Mail size={14} /> })}
                {renderInput(t("cities.email2"), form.email2, (v) => setForm({ ...form, email2: v }), { type: "email", icon: <Mail size={14} /> })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserIcon size={18} className="text-primary" /> {t("cities.management")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <UserIcon size={14} /> {t("cities.manager1")}
                  </label>
                  <select value={form.manager1} onChange={(e) => setForm({ ...form, manager1: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">{t("cities.selectManager")}</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{getUserName(u)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <UserIcon size={14} /> {t("cities.manager2")}
                  </label>
                  <select value={form.manager2} onChange={(e) => setForm({ ...form, manager2: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">{t("cities.selectManager")}</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{getUserName(u)}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPinned size={18} className="text-primary" /> {t("cities.coordinates")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {renderInput(t("cities.latitude"), form.lat, (v) => setForm({ ...form, lat: v }), { type: "number", placeholder: "6.8501", icon: <MapPinned size={14} /> })}
                  {renderInput(t("cities.longitude"), form.lng, (v) => setForm({ ...form, lng: v }), { type: "number", placeholder: "-5.2986", icon: <MapPinned size={14} /> })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck size={18} className="text-primary" /> {t("cities.statusSection")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-primary" />
                    <span className="text-sm font-medium">{t("common.active")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-destructive" />
                    <span className="text-sm font-medium">{t("common.inactive")}</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("/cities")}>
            <X size={16} /> {t("common.cancel")}
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save size={16} /> {saving ? t("common.saving") : t("cities.saveCity")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CityCreatePage;
