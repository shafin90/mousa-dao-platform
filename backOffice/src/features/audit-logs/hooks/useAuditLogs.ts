import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchAuditLogs } from "../store/auditLogSlice";

export const useAuditLogs = () => {
  const dispatch = useAppDispatch();
  const { logs, loading, error } = useAppSelector((state) => state.auditLogs);
  useEffect(() => { if (logs.length === 0) dispatch(fetchAuditLogs()); }, [dispatch, logs.length]);
  return { logs, loading, error };
};
