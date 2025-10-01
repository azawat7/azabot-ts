"use client";

import { useState, useCallback, useRef } from "react";
import { logger } from "@shaw/utils";

interface UseCSRFReturn {
  token: string | null;
  loading: boolean;
  error: string | null;
  ensureToken: () => Promise<string | null>;
  getHeaders: () => Promise<Record<string, string>>;
}

export function useCSRF(): UseCSRFReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tokenExpiryRef = useRef<number | null>(null);
  const fetchPromiseRef = useRef<Promise<string | null> | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/csrf", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      setToken(data.token);

      tokenExpiryRef.current = Date.now() + data.expiresIn * 1000;

      return data.token;
    } catch (err) {
      logger.error("Error fetching CSRF token:", err);
      setError("Failed to fetch CSRF token");
      setToken(null);
    } finally {
      setLoading(false);
      fetchPromiseRef.current = null;
    }
  }, []);

  const ensureToken = useCallback(async (): Promise<string | null> => {
    if (
      token &&
      tokenExpiryRef.current &&
      Date.now() < tokenExpiryRef.current
    ) {
      return token;
    }

    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    const promise = fetchToken();
    fetchPromiseRef.current = promise;
    return promise;
  }, [token, fetchToken]);

  const getHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const csrfToken = await ensureToken();

    if (!csrfToken) {
      return {};
    }

    return {
      "x-csrf-token": csrfToken,
    };
  }, [ensureToken]);

  return {
    token,
    loading,
    error,
    ensureToken,
    getHeaders,
  };
}
