import React from "react";
import { useTranslation } from "react-i18next";
import { useAuditLogs } from "../hooks/useAuditLogs";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import type { AuditLogData } from "@/api/auditApi";

const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { logs, loading } = useAuditLogs();

  const columns: { header: string; accessor: (item: AuditLogData) => React.ReactNode }[] = [
    { header: t("audit.timestamp"), accessor: (item) => new Date(item.createdAt).toLocaleString() },
    { header: t("audit.user"), accessor: (item) => item.userId?.email || t("audit.system") },
    { header: t("audit.module"), accessor: (item) => <Badge variant="outline">{item.module}</Badge> },
    { header: t("audit.action"), accessor: (item) => <span className="font-medium">{item.action}</span> },
    { header: t("audit.description"), accessor: (item) => item.description || '-' },
    { header: t("audit.status"), accessor: (item) => (
        <Badge variant={item.status === 'success' ? 'success' : 'destructive'}>{t(`audit.${item.status}`, { defaultValue: item.status?.toUpperCase() })}</Badge>
    )},
    { header: t("audit.ip"), accessor: (item) => <span className="font-mono text-xs">{item.ipAddress || '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("audit.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("audit.subtitle")}</p>
        </div>
      </div>
      <DataTable columns={columns} data={logs} isLoading={loading} />
    </div>
  );
};
export default AuditLogsPage;
