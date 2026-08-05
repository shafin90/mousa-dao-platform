import axios from "axios";

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://ec2-16-171-112-9.eu-north-1.compute.amazonaws.com/api/v1",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
    }
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
      const message = error.response?.data?.message || error.message || "An unexpected error occurred";
      window.dispatchEvent(new CustomEvent("app:error", { detail: message }));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
