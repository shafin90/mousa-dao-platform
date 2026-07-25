import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUsers } from "../hooks/useUsers";
import { DataTable } from "@/shared/components/tables/DataTable";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/modals/Modal";
import { RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import type { User } from "@/shared/types";

const EMPTY_FORM = { firstName: "", lastName: "", email: "", phone: "", password: "" };

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showError } = useErrorModal();
  const { users, loading, refresh } = useUsers();
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) => {
    if (u.role !== "customer") return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${u.profile?.firstName} ${u.profile?.lastName}`.toLowerCase();
      if (!name.includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const columns = [
    { header: t("users.name"), accessor: (item: User) => <span className="font-medium">{item.profile?.firstName} {item.profile?.lastName}</span> },
    { header: "Email", accessor: "email" as keyof User },
    { header: t("users.phone"), accessor: "phone" as keyof User },
  ];

  return (
    <div>
      <div data-tour="users-table">
        <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
          <div className="relative flex-1 min-w-[160px] max-w-[260px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={refresh} title="Refresh"><RefreshCw size={13} /></Button>
          </div>
        </div>
        <DataTable className="rounded-t-none border-t-0" columns={columns} data={filteredUsers} isLoading={loading} onRowClick={(row) => navigate(`/passengers/${row._id}`)} />
      </div>
    </div>
  );
};
export default UsersPage;
