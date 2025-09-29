"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SessionUser } from "@/app/lib/types";

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  sessionId: string | null;
  hasValidDiscordToken: boolean;
}

interface UseAuthReturn extends AuthState {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    sessionId: null,
    hasValidDiscordToken: false,
  });

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const checkAuth = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    isRefreshingRef.current = true;

    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
          sessionId: data.sessionId,
          hasValidDiscordToken: data.hasValidDiscordToken,
        });
      } else if (response.status === 401) {
        setAuthState({
          user: null,
          loading: false,
          error: null,
          sessionId: null,
          hasValidDiscordToken: false,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAuthState({
          user: null,
          loading: false,
          error: errorData.message || "Authentication failed",
          sessionId: null,
          hasValidDiscordToken: false,
        });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthState({
        user: null,
        loading: false,
        error: "Network error",
        sessionId: null,
        hasValidDiscordToken: false,
      });
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setAuthState({
          user: null,
          loading: false,
          error: null,
          sessionId: null,
          hasValidDiscordToken: false,
        });
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      setAuthState((prev) => ({
        ...prev,
        error: "Logout failed",
      }));
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authState.user && !refreshTimerRef.current) {
      refreshTimerRef.current = setInterval(() => {
        checkAuth();
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [authState.user, checkAuth]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && authState.user) {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authState.user, checkAuth]);

  return {
    ...authState,
    refresh: checkAuth,
    logout,
    isAuthenticated: authState.user !== null,
  };
}
