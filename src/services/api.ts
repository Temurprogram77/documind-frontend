import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/types";
import { authStorage } from "./authService";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Global Enterprise Axios Client configured for Django DRF & SimpleJWT
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Accept": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Auto-refresh JWT token on 401 Unauthorized
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not loop on auth endpoints
      if (
        originalRequest.url?.includes("/api/auth/login/") ||
        originalRequest.url?.includes("/api/auth/refresh/") ||
        originalRequest.url?.includes("/api/auth/register/")
      ) {
        return Promise.reject(formatApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) {
        authStorage.clearTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("documind:unauthorized"));
        }
        return Promise.reject(formatApiError(error));
      }

      try {
        const { data } = await axios.post<{ access: string; refresh?: string }>(
          `${API_BASE_URL}/api/auth/refresh/`,
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        authStorage.setTokens(data);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
        }
        processQueue(null, data.access);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        authStorage.clearTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("documind:unauthorized"));
        }
        return Promise.reject(formatApiError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(formatApiError(error));
  }
);

/**
 * Extracts and formats user-friendly error messages from Django DRF responses
 */
function formatApiError(error: AxiosError<any>): ApiError {
  let message = "An unexpected error occurred.";
  const data = error.response?.data;

  if (data) {
    if (typeof data === "string") {
      message = data;
    } else if (data.detail) {
      message = data.detail;
    } else if (data.error) {
      message = data.error;
    } else if (data.message) {
      message = data.message;
    } else if (typeof data === "object") {
      // DRF field errors (e.g. { username: ["This field is required."] })
      const fieldErrors = Object.entries(data)
        .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(" ") : String(errs)}`)
        .join(" | ");
      if (fieldErrors) message = fieldErrors;
    }
  } else if (error.message) {
    message = error.message;
  }

  return {
    message,
    statusCode: error.response?.status,
    status: error.response?.status,
    details: data,
  };
}

export default apiClient;
