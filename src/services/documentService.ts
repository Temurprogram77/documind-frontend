import apiClient from "./api";
import { UploadResponse, DocumentListItem, StatsResponse, ResetResponse } from "@/types";

export const documentService = {
  /**
   * Uploads PDF file to Django DRF endpoint: POST /api/documents/upload/
   * Note: We DO NOT manually set Content-Type so Axios and browser set the multipart boundary correctly!
   */
  async uploadDocument(
    file: File,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number; percentage: number }) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<UploadResponse>("/api/documents/upload/", formData, {
      onUploadProgress: (event) => {
        if (onUploadProgress && event.total) {
          const percentage = Math.round((event.loaded * 100) / event.total);
          onUploadProgress({ loaded: event.loaded, total: event.total, percentage });
        }
      },
    });

    return response.data;
  },

  /**
   * Fetches list of documents owned by the authenticated user: GET /api/documents/
   */
  async getDocuments(): Promise<DocumentListItem[]> {
    const response = await apiClient.get<DocumentListItem[]>("/api/documents/");
    return response.data;
  },

  /**
   * Fetches vector store statistics (if available)
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await apiClient.get<StatsResponse>("/api/stats/");
      return response.data;
    } catch {
      return { total_chunks: 0 };
    }
  },

  /**
   * Purges the vector store (Staff/Admin only): DELETE /api/admin/reset/
   */
  async resetStore(adminToken?: string): Promise<ResetResponse> {
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }
    const response = await apiClient.delete<ResetResponse>("/api/admin/reset/", { headers });
    return response.data;
  },

  /**
   * Deletes a document and its vector chunks: DELETE /api/documents/<id>/
   */
  async deleteDocument(id: number): Promise<{ status: string; message: string }> {
    const response = await apiClient.delete<{ status: string; message: string }>(`/api/documents/${id}/`);
    return response.data;
  },
};

export default documentService;
