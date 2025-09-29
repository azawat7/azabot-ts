"use client";

import Link from "next/link";
import { LogoutButton } from "@/app/components/auth/LogoutButton";
import { LoginButton } from "@/app/components/auth/LoginButton";
import { useAuthContext } from "@/app/contexts/AuthContext";

export function Navbar() {
  const { user, isAuthenticated } = useAuthContext();

  return (
    <nav className="border-b  border-neutral-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-white">
              azabot
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {isAuthenticated && user ? (
              <>
                <LogoutButton />
                <img
                  src={
                    user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : `https://cdn.discordapp.com/embed/avatars/${
                          parseInt(user.id) % 5
                        }.png`
                  }
                  alt={`${user.username}'s avatar`}
                  className="w-10 h-10 rounded-full"
                />
              </>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
