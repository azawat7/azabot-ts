"use client";

import { useCSRF } from "@/app/hooks/useCSRF";
import { useState } from "react";
import { Button } from "../ui/Button";
import { useAuth } from "@/app/hooks/useAuth";
import { useGuildContext } from "@/app/contexts/GuildContext";

export function LogoutButton() {
  const { getHeaders } = useCSRF();
  const { clearAllGuildCache } = useGuildContext();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const headers = await getHeaders();

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        clearAllGuildCache();
        await logout();
        window.location.href = "/";
      } else {
        const data = await response.json();
        console.error("Logout failed:", data.message || "Unknown error");

        if (response.status === 403) {
          window.location.href = "/";
        }
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      isLoading={isLoading}
      variant="danger"
      size="md"
    >
      Logout
    </Button>
  );
}
