import { auditApi } from "@/api/auditApi";

export const auditLogService = {
  getAll: async (params?: { page?: number; limit?: number; module?: string; action?: string }) => {
    const result = await auditApi.getAll(params);
    return result;
  },
};
