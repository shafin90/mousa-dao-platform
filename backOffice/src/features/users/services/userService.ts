import { userApi } from "@/api/userApi";
import type { User } from "@/shared/types";

export const userService = {
  getAll: async (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const result = await userApi.getAll(params);
    return result;
  },
  create: async (payload: { firstName: string; lastName: string; email: string; phone: string; password: string; role: string }): Promise<User> => {
    return userApi.create(payload);
  },
  update: async (id: string, payload: Partial<{ firstName: string; lastName: string; email: string; phone: string; password: string; role: string }>): Promise<User> => {
    return userApi.update(id, payload);
  },
  remove: async (id: string): Promise<void> => {
    return userApi.remove(id);
  },
  updateStatus: async (id: string, isActive: boolean): Promise<User> => {
    return userApi.updateStatus(id, isActive);
  },
  updateRole: async (id: string, role: string): Promise<User> => {
    return userApi.updateRole(id, role);
  },
};
