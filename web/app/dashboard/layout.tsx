"use client";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { ReactNode } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { LogoutButton } from "../components/auth/LogoutButton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <nav className="border-r-1 border-zinc-700 h-full w-xs">
          <div className="border-b-1 border-zinc-700 h-22 mb-12 flex items-center justify-center text-4xl">
            <a href="/" className="select-none text-white">
              All Bot
            </a>
          </div>
          <div>sidebar</div>
        </nav>
        <div className="grow">
          <div className="border-b-1 border-zinc-700 h-22 flex items-center justify-end gap-7 p-6">
            <LogoutButton />
            <div className="border-r-1 border-zinc-700 h-full"></div>
            {user ? (
              <>
                <span className="text-xl text-white">@{user.username}</span>
                <img
                  src={
                    user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : `https://cdn.discordapp.com/embed/avatars/${
                          parseInt(user.id) % 5
                        }.png`
                  }
                  alt={`${user.username}'s avatar`}
                  className="w-14 h-14 rounded-full select-none"
                />
              </>
            ) : (
              <></>
            )}
          </div>
          <div className="p-8">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
