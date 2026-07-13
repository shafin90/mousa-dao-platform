import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AuditLogData } from "@/api/auditApi";
import { auditLogService } from "../services/auditLogService";

interface AuditLogState {
  logs: AuditLogData[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: AuditLogState = { logs: [], total: 0, loading: false, error: null };

export const fetchAuditLogs = createAsyncThunk(
  "auditLogs/fetchAuditLogs",
  async (params?: { page?: number; limit?: number; module?: string; action?: string }) => {
    return await auditLogService.getAll(params);
  }
);

const auditLogSlice = createSlice({
  name: "auditLogs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAuditLogs.fulfilled, (s, a) => { s.loading = false; s.logs = a.payload.logs || []; s.total = a.payload.total || 0; })
      .addCase(fetchAuditLogs.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; });
  },
});
export default auditLogSlice.reducer;
