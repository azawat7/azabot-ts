"use client";

import { useAuthContext } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/app/components/ui/Dropdown";
import { useState } from "react";
import {
  HiChevronRight,
  HiHome,
  HiArrowRightOnRectangle,
} from "react-icons/hi2";
import { HiArrowPath } from "react-icons/hi2";

export function UserDropdown() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  if (!user) {
    return null;
  }

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;

  return (
    <Dropdown
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      trigger={
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-zinc-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
        >
          <img
            src={avatarUrl}
            alt={`${user.username}'s avatar`}
            width={32}
            height={32}
            className="rounded-full "
          />
          <span className="text-white font-medium text-sm">
            {user.username}
          </span>
          <HiChevronRight
            className={`w-4 h-4 text-zinc-300 transition-transform duration-200 ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        </button>
      }
    >
      <button
        onClick={handleDashboardClick}
        className="w-full px-3 py-2 text-left text-zinc-200 hover:text-white hover:bg-zinc-700 transition-all duration-200 flex items-center justify-between group rounded-md cursor-pointer"
      >
        <span className="font-medium">Dashboard</span>
        <HiHome className="w-5 h-5 text-zinc-300" />
      </button>

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full px-3 py-2 text-left text-zinc-200 hover:text-white hover:bg-zinc-700 transition-all duration-200 flex items-center justify-between group rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="font-medium">Logout</span>
        {isLoggingOut ? (
          <HiArrowPath className="w-5 h-5 text-zinc-300 animate-spin" />
        ) : (
          <HiArrowRightOnRectangle className="w-5 h-5 text-zinc-300" />
        )}
      </button>
    </Dropdown>
  );
}
