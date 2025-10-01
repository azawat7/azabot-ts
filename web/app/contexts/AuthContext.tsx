"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { UseAuthReturn } from "../lib/types";

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const contextValue = useMemo(
    () => ({
      user: auth.user,
      loading: auth.loading,
      error: auth.error,
      sessionId: auth.sessionId,
      hasValidDiscordToken: auth.hasValidDiscordToken,
      isAuthenticated: auth.isAuthenticated,
      refresh: auth.refresh,
      logout: auth.logout,
    }),
    [
      auth.user,
      auth.loading,
      auth.error,
      auth.sessionId,
      auth.hasValidDiscordToken,
      auth.isAuthenticated,
      auth.refresh,
      auth.logout,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
