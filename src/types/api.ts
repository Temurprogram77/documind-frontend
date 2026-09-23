export interface ApiError {
  message: string;
  statusCode?: number;
  status?: number;
  details?: unknown;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface StatsResponse {
  total_chunks?: number;
  indexed_chunks?: number;
}

export interface ResetResponse {
  status?: string;
  success?: boolean;
  message: string;
}
