"use client";

import React, { useState } from "react";
import { X, Lock, User as UserIcon, Mail, KeyRound, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setError(null);
  };

  const handleModeSwitch = (mode: boolean) => {
    setIsLoginMode(mode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (!isLoginMode) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== passwordConfirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        await login({ username: username.trim(), password });
      } else {
        await register({
          username: username.trim(),
          password,
          password_confirm: passwordConfirm,
          email: email.trim() || undefined,
        });
      }
      resetForm();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (err.response?.data && typeof err.response.data === "object"
          ? Object.entries(err.response.data)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
              .join(" | ")
          : null) ||
        err.message ||
        "Authentication failed. Please check your credentials.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
            {isLoginMode ? "Sign in to DocuMind" : "Create an Account"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLoginMode
              ? "Access your isolated ChromaDB knowledge bases & documents"
              : "Register to partition your own enterprise documents securely"}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-5 border border-slate-800/80">
          <button
            type="button"
            onClick={() => handleModeSwitch(true)}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              isLoginMode
                ? "bg-teal-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch(false)}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              !isLoginMode
                ? "bg-teal-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-red-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="enterprise_user"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address <span className="text-slate-500">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@enterprise.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isLoginMode ? "Signing in..." : "Registering..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isLoginMode ? "Sign In" : "Create Account"}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-500 mt-5">
          JWT Multi-Tenant Isolation • Django 5 REST Backend
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
