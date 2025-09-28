"use client";

import { useState, useEffect } from "react";
import { SessionUser } from "@/app/lib/types";

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  sessionId: string | null;
  hasValidDiscordToken: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    sessionId: null,
    hasValidDiscordToken: false,
  });

  const checkAuth = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
          sessionId: data.sessionId,
          hasValidDiscordToken: data.hasValidDiscordToken,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: "Authentication failed",
          sessionId: null,
          hasValidDiscordToken: false,
        });
      }
    } catch (error) {
      setAuthState({
        user: null,
        loading: false,
        error: "Network error",
        sessionId: null,
        hasValidDiscordToken: false,
      });
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAuthState({
        user: null,
        loading: false,
        error: null,
        sessionId: null,
        hasValidDiscordToken: false,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const forceRefresh = async () => {
    await checkAuth();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    refresh: checkAuth,
    forceRefresh,
    logout,
  };
}
