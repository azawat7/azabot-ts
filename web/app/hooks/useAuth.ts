"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AuthState, UseAuthReturn } from "../lib/types";
import { REFRESH_INTERVAL } from "../lib/config/constants";

export function useAuth(): UseAuthReturn {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    sessionId: null,
    hasValidDiscordToken: false,
  });

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  const checkAuth = useCallback(async () => {
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    if (isRefreshingRef.current) {
      return;
    }
    isRefreshingRef.current = true;

    const fetchPromise = (async () => {
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
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  const logout = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

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

  return {
    ...authState,
    refresh: checkAuth,
    logout,
    isAuthenticated: authState.user !== null,
  };
}
