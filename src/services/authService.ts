import axios from "axios";
import { API_BASE_URL } from "./api";
import { AuthTokens, LoginRequest, RegisterRequest, User } from "@/types";

const ACCESS_TOKEN_KEY = "documind_access_token";
const REFRESH_TOKEN_KEY = "documind_refresh_token";

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(tokens: { access: string; refresh?: string }) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    if (tokens.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    }
  },

  clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const authService = {
  /**
   * User Registration -> POST /api/auth/register/
   */
  async register(data: RegisterRequest): Promise<User> {
    const response = await axios.post<User>(`${API_BASE_URL}/api/auth/register/`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  /**
   * User Login -> POST /api/auth/login/ (Returns access and refresh JWT tokens)
   */
  async login(credentials: LoginRequest): Promise<AuthTokens> {
    const response = await axios.post<AuthTokens>(`${API_BASE_URL}/api/auth/login/`, credentials, {
      headers: { "Content-Type": "application/json" },
    });
    authStorage.setTokens(response.data);
    return response.data;
  },

  /**
   * Refresh JWT Token -> POST /api/auth/refresh/
   */
  async refresh(refresh: string): Promise<{ access: string; refresh?: string }> {
    const response = await axios.post<{ access: string; refresh?: string }>(
      `${API_BASE_URL}/api/auth/refresh/`,
      { refresh },
      { headers: { "Content-Type": "application/json" } }
    );
    authStorage.setTokens(response.data);
    return response.data;
  },

  /**
   * Fetch Authenticated User Profile -> GET /api/auth/me/
   */
  async getCurrentUser(): Promise<User> {
    const token = authStorage.getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await axios.get<User>(`${API_BASE_URL}/api/auth/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  logout() {
    authStorage.clearTokens();
  },
};

export default authService;
