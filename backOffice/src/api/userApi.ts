import apiClient from "./apiClient";
import type { ApiResponse, User } from "@/shared/types";

export const userApi = {
  getAll: async (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const { data } = await apiClient.get<{ data: unknown; pagination?: { total?: number; page?: number; pages?: number } }>("/users", { params });
    const payload = data.data;
    // Backend may return either a paginated array ({ data: [...], pagination })
    // or an object ({ users, total, page, pages }). Normalize both shapes.
    if (Array.isArray(payload)) {
      return {
        users: payload as User[],
        total: data.pagination?.total ?? payload.length,
        page: data.pagination?.page ?? 1,
        pages: data.pagination?.pages ?? 1,
      };
    }
    const obj = (payload || {}) as { users?: User[]; total?: number; page?: number; pages?: number };
    return {
      users: obj.users ?? [],
      total: obj.total ?? 0,
      page: obj.page ?? 1,
      pages: obj.pages ?? 1,
    };
  },
  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },
  create: async (payload: { firstName: string; lastName: string; email: string; phone: string; password: string; role: string }): Promise<User> => {
    const { data } = await apiClient.post<ApiResponse<User>>("/users", payload);
    return data.data;
  },
  updateStatus: async (id: string, isActive: boolean): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { isActive });
    return data.data;
  },
  updateRole: async (id: string, role: string): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return data.data;
  },
  update: async (id: string, payload: Partial<{ firstName: string; lastName: string; email: string; phone: string; password: string; role: string }>): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
