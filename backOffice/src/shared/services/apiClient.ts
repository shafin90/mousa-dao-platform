import axios from "axios";
import { toast } from "sonner";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
      window.location.href = "/login";
    }
    if (!isLoginRequest) {
      const message = error.response?.data?.message || error.message || "An error occurred";
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
