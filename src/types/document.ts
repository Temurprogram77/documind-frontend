export interface UploadResponse {
  status: string;
  chunks_processed: number;
  document_id: number;
  filename: string;
}

export interface DocumentListItem {
  id: number;
  filename: string;
  uploaded_at: string;
}

export interface DocumentInfo {
  filename: string;
  chunksCount: number;
  documentId: number | string;
  uploadedAt?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}
