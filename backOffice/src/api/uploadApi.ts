import apiClient from "./apiClient";
import type { ApiResponse } from "@/shared/types";

interface UploadResult {
  urls: string[];
  url: string;
}

export const uploadApi = {
  /** Uploads one or more image files and returns their public URLs. */
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const { data } = await apiClient.post<ApiResponse<UploadResult>>("/uploads", formData, {
      // Let the browser set multipart/form-data with the correct boundary.
      headers: { "Content-Type": undefined as unknown as string },
    });
    return data.data.urls;
  },
};
