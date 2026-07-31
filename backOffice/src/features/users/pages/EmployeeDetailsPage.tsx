import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  Briefcase,
  Clock,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { userApi } from "@/api/userApi";
import type { User } from "@/shared/types";
import { useAppSelector } from "@/app/store";

const EMPLOYEE_ROLES = ["admin", "staff", "driver"];

const SECTIONS = [
  { id: "overview", label: "Overview", icon: UserIcon },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

const employmentStatusVariant = (status?: string) => {
  switch (status) {
    case "active": return "success" as const;
    case "on_leave": return "warning" as const;
    case "terminated": return "destructive" as const;
    case "inactive": return "secondary" as const;
    default: return "secondary" as const;
  }
};

const EmployeeDetailsPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showError } = useErrorModal();
  const currentUserId = useAppSelector((state) => state.auth.user?._id);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isSelf = user?._id === currentUserId;

  const loadUser = useCallback(async () => {
    try {
      const data = await userApi.getById(id);
      if (!data) { setNotFound(true); return; }
      setUser(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      const updated = await userApi.updateStatus(user._id, !user.authTracking?.isLocked);
      setUser(updated);
      toast.success(user.authTracking?.isLocked ? t("users.unlockedMsg") : t("users.lockedMsg"));
    } catch { showError(t("users.toggleFailed")); }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      await userApi.remove(user._id);
      toast.success(t("users.deleted"));
      navigate("/employees");
    } catch { showError(t("users.deleteFailed")); }
  };

  const renderField = (label: string, value: React.ReactNode, icon?: React.ReactNode) => (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon && <span className="shrink-0">{icon}</span>}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !user || !EMPLOYEE_ROLES.includes(user.role)) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/employees")}>
          <ArrowLeft size={16} /> {t("employees.backToEmployees")}
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">{t("users.noData")}</CardContent>
        </Card>
      </div>
    );
  }

  const createdByDisplay = (() => {
    if (!user.createdBy) return "—";
    if (typeof user.createdBy === "object")
      return `${user.createdBy.profile.firstName} ${user.createdBy.profile.lastName}`;
    return user.createdBy;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/employees")}>
            <ArrowLeft size={16} /> {t("employees.backToEmployees")}
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UserIcon size={22} className="text-primary" />
            <span>{user.profile.firstName} {user.profile.lastName}</span>
            <Badge variant="outline" className="capitalize">{t(`roles.${user.role}`, user.role)}</Badge>
            <Badge variant={user.authTracking?.isLocked ? "destructive" : "success"}>
              {user.authTracking?.isLocked ? t("users.locked") : t("users.active")}
            </Badge>
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{user._id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleToggleStatus} disabled={isSelf} title={isSelf ? t("users.cannotLockSelf") : ""}>
            {user.authTracking?.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
            {user.authTracking?.isLocked ? t("users.unlock") : t("users.lock")}
          </Button>
          {activeSection === "overview" && (
            <Button size="sm" className="gap-2" onClick={() => navigate(`/employees/${user._id}/edit`)}>
              <Edit3 size={16} /> {t("users.editUser")}
            </Button>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-1 overflow-x-auto border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeSection === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeSection === "overview" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserIcon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.name")}</p>
                  <p className="truncate text-lg font-semibold">{user.profile.firstName} {user.profile.lastName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.email")}</p>
                  <p className="truncate text-lg font-semibold">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.phone")}</p>
                  <p className="truncate text-lg font-semibold">{user.phone || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.role")}</p>
                  <p className="truncate text-lg font-semibold capitalize">{t(`roles.${user.role}`, user.role)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "contact" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail size={18} className="text-primary" /> Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("employees.email1"), user.email || "—", <Mail size={14} />)}
              {renderField(t("employees.email2"), user.email2 || "—", <Mail size={14} />)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone size={18} className="text-primary" /> Phone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("employees.phone1"), user.phone || "—", <Phone size={14} />)}
              {renderField(t("employees.phone2"), user.phone2 || "—", <Phone size={14} />)}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "employment" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase size={18} className="text-primary" /> {t("employees.employmentStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("users.role"), <Badge variant="outline" className="capitalize">{t(`roles.${user.role}`, user.role)}</Badge>, <ShieldCheck size={14} />)}
              {renderField(t("employees.employmentStatus"), <Badge variant={employmentStatusVariant(user.employmentStatus)}>{t(`employees.${user.employmentStatus ?? "active"}`, user.employmentStatus ?? "active")}</Badge>, <Briefcase size={14} />)}
              {renderField(t("employees.dateOfBirth"), user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "—", <CalendarDays size={14} />)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock size={18} className="text-primary" /> {t("cities.auditInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderField(t("employees.createdAt"), user.createdAt ? new Date(user.createdAt).toLocaleString() : "—", <Clock size={14} />)}
              {renderField(t("employees.createdBy"), createdByDisplay, <UserIcon size={14} />)}
              {user.authTracking?.lastLogin && renderField(t("users.lastLogin"), new Date(user.authTracking.lastLogin).toLocaleString(), <Clock size={14} />)}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "security" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck size={18} className="text-primary" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderField(t("users.status"), <Badge variant={user.authTracking?.isLocked ? "destructive" : "success"}>{user.authTracking?.isLocked ? t("users.locked") : t("users.active")}</Badge>, <ShieldCheck size={14} />)}
            {renderField("Failed login attempts", String(user.authTracking?.failedLoginAttempts ?? 0), <KeyRound size={14} />)}
            {user.authTracking?.lastLogin && renderField(t("users.lastLogin"), new Date(user.authTracking.lastLogin).toLocaleString(), <Clock size={14} />)}
          </CardContent>
          <CardContent className="border-t pt-4">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              disabled={isSelf}
              title={isSelf ? t("users.cannotDeleteSelf") : ""}
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 size={16} /> {t("users.deleteUser")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t("users.deleteUser")}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("users.confirmDelete", { name: `${user.profile.firstName} ${user.profile.lastName}`, email: user.email })}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeDetailsPage;
