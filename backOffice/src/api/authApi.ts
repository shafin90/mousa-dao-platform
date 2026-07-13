import apiClient from "./apiClient";
import type { ApiResponse, AuthResponse, User } from "@/shared/types";

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", { email, password });
    return data.data;
  },
  register: async (payload: { name: string; email: string; phone: string; password: string; role?: string }) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", payload);
    return data.data;
  },
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },
};
