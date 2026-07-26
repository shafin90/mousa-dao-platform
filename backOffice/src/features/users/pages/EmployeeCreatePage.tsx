import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Save,
  X,
  User as UserIcon,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
  Briefcase,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { userApi } from "@/api/userApi";

interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  email2: string;
  phone: string;
  phone2: string;
  password: string;
  role: string;
  dateOfBirth: string;
  employmentStatus: string;
}

const EMPTY_FORM: EmployeeForm = {
  firstName: "", lastName: "", email: "", email2: "",
  phone: "", phone2: "", password: "", role: "staff",
  dateOfBirth: "", employmentStatus: "active",
};

const EmployeeCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useErrorModal();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmployeeForm>({ ...EMPTY_FORM });

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
        required={opts.required}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      showError(t("users.validationRequired"));
      return;
    }
    setSaving(true);
    try {
      const created = await userApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        phone2: form.phone2 || undefined,
        email2: form.email2 || undefined,
        password: form.password,
        role: form.role,
        dateOfBirth: form.dateOfBirth || undefined,
        employmentStatus: form.employmentStatus,
      });
      toast.success(t("users.created"));
      navigate(`/employees/${created._id}`);
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "response" in e)
        ? ((e as { response: { data: { message: string } } }).response?.data?.message ?? t("users.createFailed"))
        : t("users.createFailed");
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/employees")}>
            <ArrowLeft size={16} /> {t("employees.backToEmployees")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UserIcon size={22} className="text-primary" />
            {t("employees.createEmployee")}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserIcon size={18} className="text-primary" /> {t("employees.personalInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderInput(t("users.firstName"), form.firstName, (v) => setForm({ ...form, firstName: v }), { required: true, icon: <UserIcon size={14} />, placeholder: t("users.firstNamePlaceholder") })}
                {renderInput(t("users.lastName"), form.lastName, (v) => setForm({ ...form, lastName: v }), { required: true, icon: <UserIcon size={14} />, placeholder: t("users.lastNamePlaceholder") })}
                {renderInput(t("employees.dateOfBirth"), form.dateOfBirth, (v) => setForm({ ...form, dateOfBirth: v }), { type: "date", icon: <CalendarDays size={14} /> })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone size={18} className="text-primary" /> {t("cities.contactInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderInput(t("employees.email1"), form.email, (v) => setForm({ ...form, email: v }), { required: true, type: "email", icon: <Mail size={14} />, placeholder: t("users.emailPlaceholder") })}
                {renderInput(t("employees.email2"), form.email2, (v) => setForm({ ...form, email2: v }), { type: "email", icon: <Mail size={14} /> })}
                {renderInput(t("employees.phone1"), form.phone, (v) => setForm({ ...form, phone: v }), { required: true, type: "tel", icon: <Phone size={14} />, placeholder: t("users.phonePlaceholder") })}
                {renderInput(t("employees.phone2"), form.phone2, (v) => setForm({ ...form, phone2: v }), { type: "tel", icon: <Phone size={14} /> })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase size={18} className="text-primary" /> {t("employees.accountInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <ShieldCheck size={14} /> {t("users.role")}
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="staff">{t("roles.staff")}</option>
                    <option value="driver">{t("roles.driver")}</option>
                    <option value="admin">{t("roles.admin")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Briefcase size={14} /> {t("employees.employmentStatus")}
                  </label>
                  <select
                    value={form.employmentStatus}
                    onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">{t("employees.active")}</option>
                    <option value="inactive">{t("employees.inactive")}</option>
                    <option value="on_leave">{t("employees.on_leave")}</option>
                    <option value="terminated">{t("employees.terminated")}</option>
                  </select>
                </div>
                {renderInput(t("users.password"), form.password, (v) => setForm({ ...form, password: v }), { required: true, type: "password", icon: <KeyRound size={14} />, placeholder: t("users.passwordPlaceholder") })}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("/employees")}>
            <X size={16} /> {t("common.cancel")}
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save size={16} /> {saving ? t("common.saving") : t("employees.saveEmployee")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeCreatePage;
