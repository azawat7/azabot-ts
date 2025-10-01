"use client";

import { useCSRF } from "@/app/hooks/useCSRF";
import { useState } from "react";

export function LogoutButton() {
  const { getHeaders } = useCSRF();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    try {
      const headers = await getHeaders();
      setIsLoading(true);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers,
      });

      if (response.ok) {
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
    <button
      onClick={handleLogout}
      className="p-2 bg-red-500 text-white cursor-pointer rounded-md"
    >
      Logout
    </button>
  );
}
