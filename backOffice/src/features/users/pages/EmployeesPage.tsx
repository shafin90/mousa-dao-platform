import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUsers } from "../hooks/useUsers";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/modals/Modal";
import { Plus, RefreshCw, Trash2, Pencil, Search, X, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { useAppSelector } from "@/app/store";
import { userApi } from "@/api/userApi";
import type { User } from "@/shared/types";

const EMPLOYEE_ROLES = ["admin", "staff", "driver"];

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "", phone2: "", email2: "",
  password: "", role: "staff", dateOfBirth: "", employmentStatus: "active",
};

const EmployeesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useErrorModal();
  const { users, loading, refresh } = useUsers();
  const currentUserId = useAppSelector((state) => state.auth.user?._id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");

  const isEditing = !!editingUser;

  const employees = users.filter((u) => EMPLOYEE_ROLES.includes(u.role));

  const filtered = employees.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${u.profile?.firstName} ${u.profile?.lastName}`.toLowerCase();
    return name.includes(q) || u.email.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        phone2: form.phone2 || undefined,
        email2: form.email2 || undefined,
        role: form.role,
        dateOfBirth: form.dateOfBirth || undefined,
        employmentStatus: form.employmentStatus,
      };
      if (form.password) payload.password = form.password;

      if (isEditing) {
        await userApi.update(editingUser!._id, payload);
        toast.success(t("users.updated"));
      } else {
        await userApi.create(payload as Parameters<typeof userApi.create>[0]);
        toast.success(t("users.created"));
      }
      closeForm();
      refresh();
    } catch {
      showError(t("users.updateFailed"));
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await userApi.remove(userToDelete._id);
      toast.success(t("users.deleted"));
      setIsDeleteOpen(false);
      setUserToDelete(null);
      refresh();
    } catch {
      showError(t("users.deleteFailed"));
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userApi.updateStatus(user._id, user.authTracking?.isLocked);
      toast.success(user.authTracking?.isLocked ? t("users.unlockedMsg") : t("users.lockedMsg"));
      refresh();
    } catch { showError(t("users.toggleFailed")); }
  };

  const renderCreatedBy = (u: User) => {
    if (!u.createdBy) return "—";
    if (typeof u.createdBy === "object")
      return `${u.createdBy.profile?.firstName || ""} ${u.createdBy.profile?.lastName || ""}`.trim() || "—";
    return "—";
  };

  const columns = [
    { header: t("users.firstName"), accessor: (u: User) => u.profile?.firstName || "—" },
    { header: t("users.lastName"), accessor: (u: User) => u.profile?.lastName || "—" },
    { header: t("employees.dateOfBirth"), accessor: (u: User) => u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString() : "—" },
    { header: t("employees.phone1"), accessor: "phone" as keyof User },
    { header: t("employees.phone2"), accessor: (u: User) => u.phone2 || "—" },
    { header: t("employees.email1"), accessor: "email" as keyof User },
    { header: t("employees.email2"), accessor: (u: User) => u.email2 || "—" },
    { header: t("employees.createdAt"), accessor: (u: User) => u.createdAt ? new Date(u.createdAt).toLocaleString() : "—" },
    { header: t("employees.createdBy"), accessor: renderCreatedBy },
    {
      header: t("users.actions"),
      accessor: (u: User) => {
        const isSelf = u._id === currentUserId;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title={t("common.edit")} onClick={(e) => { e.stopPropagation(); navigate(`/employees/${u._id}/edit`); }}>
              <Pencil size={12} />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={isSelf} title={isSelf ? t("users.cannotDeleteSelf") : ""} onClick={(e) => { e.stopPropagation(); setUserToDelete(u); setIsDeleteOpen(true); }}>
              <Trash2 size={12} className="text-destructive" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={isSelf} title={isSelf ? t("users.cannotLockSelf") : u.authTracking?.isLocked ? t("users.unlock") : t("users.lock")} onClick={(e) => { e.stopPropagation(); handleToggleStatus(u); }}>
              {u.authTracking?.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div data-tour="employees-table">
        <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
          <div className="relative flex-1 min-w-[160px] max-w-[260px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-7 pl-8 pr-7 rounded border bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-5 bg-border" />
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={refresh} title="Refresh"><RefreshCw size={13} /></Button>
            <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate("/employees/new")}>
              <Plus size={13} /> Add
            </Button>
          </div>
        </div>
        <DataTable className="rounded-t-none border-t-0" columns={columns} data={filtered} isLoading={loading} onRowClick={(u) => navigate(`/employees/${u._id}`)} />
      </div>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setUserToDelete(null); }} title={t("users.deleteUser")}>
        {userToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("users.confirmDelete", { name: `${userToDelete.profile?.firstName} ${userToDelete.profile?.lastName}`, email: userToDelete.email })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setUserToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isFormOpen} onClose={closeForm} title={isEditing ? t("users.editUser") : t("users.createUser")} className="max-w-lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("users.firstName")}</label>
              <input required type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("users.firstNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("users.lastName")}</label>
              <input required type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("users.lastNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("employees.email1")}</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("users.emailPlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("employees.email2")}</label>
              <input type="email" value={form.email2} onChange={(e) => setForm({ ...form, email2: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("employees.phone1")}</label>
              <input required type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("users.phonePlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("employees.phone2")}</label>
              <input type="text" value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("employees.dateOfBirth")}</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("employees.employmentStatus")}</label>
              <select value={form.employmentStatus} onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })} className="w-full rounded-md border bg-background p-2">
                <option value="active">{t("employees.active")}</option>
                <option value="inactive">{t("employees.inactive")}</option>
                <option value="on_leave">{t("employees.on_leave")}</option>
                <option value="terminated">{t("employees.terminated")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("users.role")}</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-md border bg-background p-2">
                <option value="staff">{t("roles.staff")}</option>
                <option value="driver">{t("roles.driver")}</option>
                <option value="admin">{t("roles.admin")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{isEditing ? t("users.newPassword") : t("users.password")}</label>
              <input required={!isEditing} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={isEditing ? t("users.passwordEditPlaceholder") : t("users.passwordPlaceholder")} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>{t("common.cancel")}</Button>
            <Button type="submit">{isEditing ? t("users.updateUser") : t("users.createUser")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default EmployeesPage;