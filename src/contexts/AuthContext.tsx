"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, LoginRequest, RegisterRequest } from "@/types";
import { authService, authStorage } from "@/services";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  // Fetch authenticated user profile on initial load
  useEffect(() => {
    const initAuth = async () => {
      const token = authStorage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        authStorage.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Global listener for 401 unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthModalOpen(true);
    };

    window.addEventListener("documind:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("documind:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    await authService.login(credentials);
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    closeAuthModal();
  };

  const register = async (data: RegisterRequest) => {
    await authService.register(data);
    // Automatically log in after registration
    await login({ username: data.username, password: data.password });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
