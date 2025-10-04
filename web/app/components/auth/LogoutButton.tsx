"use client";

import { useCSRF } from "@/app/hooks/useCSRF";
import { useState } from "react";
import { Button } from "../ui/Button";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGuildContext } from "@/app/contexts/GuildContext";

export function LogoutButton() {
  const { getHeaders } = useCSRF();
  const { clearAll } = useGuildContext();
  const { logout } = useAuthContext();
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
        clearAll();
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
