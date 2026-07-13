import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUsers } from "../hooks/useUsers";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { Modal } from "@/shared/components/modals/Modal";
import { Plus, RefreshCw, Pencil, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store";
import type { User } from "@/shared/types";

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "driver", label: "Driver" },
  { value: "customer", label: "Customer" },
];

const CREATE_ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "driver", label: "Driver" },
  { value: "admin", label: "Admin" },
];

const EMPTY_FORM = { firstName: "", lastName: "", email: "", phone: "", password: "", role: "staff" };

const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { users, loading, create, update, remove, updateStatus, refresh } = useUsers();
  const currentUserId = useAppSelector((state) => state.auth.user?._id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [roleFilter, setRoleFilter] = useState("all");

  const isEditing = !!editingUser;

  const filteredUsers = roleFilter === "all" ? users : users.filter(u => u.role === roleFilter);

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      firstName: user.profile?.firstName || "",
      lastName: user.profile?.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "staff",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const payload: Record<string, string> = {};
      if (form.firstName) payload.firstName = form.firstName;
      if (form.lastName) payload.lastName = form.lastName;
      if (form.email) payload.email = form.email;
      if (form.phone) payload.phone = form.phone;
      if (form.password) payload.password = form.password;
      if (form.role) payload.role = form.role;
      try {
        await update(editingUser!._id, payload);
        toast.success(t("users.updated"));
        closeForm();
      } catch {
        toast.error(t("users.updateFailed"));
      }
    } else {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        toast.error(t("users.validationRequired"));
        return;
      }
      try {
        await create(form);
        toast.success(t("users.created"));
        closeForm();
      } catch {
        toast.error(t("users.createFailed"));
      }
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await remove(userToDelete._id);
      toast.success(t("users.deleted"));
      setIsDeleteOpen(false);
      setUserToDelete(null);
    } catch {
      toast.error(t("users.deleteFailed"));
    }
  };

  const columns = [
    { header: t("users.name"), accessor: (item: User) => (
        <div>
          <p className="font-medium">{item.profile?.firstName} {item.profile?.lastName}</p>
          <p className="text-xs text-muted-foreground">{item.email}</p>
        </div>
      )
    },
    { header: t("users.phone"), accessor: "phone" as keyof User },
    { header: t("users.role"), accessor: (item: User) => (
        <Badge variant="outline" className="capitalize">{item.role}</Badge>
    )},
    { header: t("users.status"), accessor: (item: User) => (
        <Badge variant={item.authTracking?.isLocked ? 'destructive' : 'success'}>
          {item.authTracking?.isLocked ? t("users.locked") : t("users.active")}
        </Badge>
    )},
    { header: t("users.actions"), accessor: (item: User) => {
        const isSelf = item._id === currentUserId;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
              <Pencil size={14} />
            </Button>
            <Button variant="ghost" size="sm" disabled={isSelf} title={isSelf ? t("users.cannotDeleteSelf") : ""} onClick={() => { setUserToDelete(item); setIsDeleteOpen(true); }}>
              <Trash2 size={14} className="text-destructive" />
            </Button>
            <Button variant="ghost" size="sm" disabled={isSelf} title={isSelf ? t("users.cannotLockSelf") : ""} onClick={() => handleToggleStatus(item)}>
              {item.authTracking?.isLocked ? t("users.unlock") : t("users.lock")}
            </Button>
          </div>
        );
      }},
  ];

  const handleToggleStatus = async (user: User) => {
    try {
      await updateStatus(user._id, user.authTracking?.isLocked);
      toast.success(t("users.lockedMsg"));
    } catch { toast.error(t("users.toggleFailed")); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("users.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("users.subtitle")}</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={ROLE_OPTIONS}
              className="w-36"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}><RefreshCw size={16} /> {t("common.refresh")}</Button>
          <Button size="sm" className="gap-2" onClick={openCreate}><Plus size={16} /> {t("users.createUser")}</Button>
        </div>
      </div>
      <DataTable columns={columns} data={filteredUsers} isLoading={loading} />

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
              <input required={!isEditing} type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("users.firstNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("users.lastName")}</label>
              <input required={!isEditing} type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("users.lastNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("users.email")}</label>
              <input required={!isEditing} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("users.emailPlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("users.phoneLabel")}</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={t("users.phonePlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{isEditing ? t("users.newPassword") : t("users.password")}</label>
              <input required={!isEditing} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-2 border rounded-md bg-muted/30" placeholder={isEditing ? t("users.passwordEditPlaceholder") : t("users.passwordPlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("users.role")}</label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={CREATE_ROLE_OPTIONS} />
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
export default UsersPage;
