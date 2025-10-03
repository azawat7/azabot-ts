"use client";

import Link from "next/link";
import { LogoutButton } from "@/app/components/auth/LogoutButton";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { Button } from "../ui/Button";
import { useState } from "react";

export function Navbar() {
  const { user, isAuthenticated } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoading = () => {
    setIsLoading(true);
  };

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
                <Button
                  onClick={handleLoading}
                  isLoading={isLoading}
                  variant="secondary"
                  size="md"
                  as="a"
                  href="/dashboard"
                >
                  Dashboard
                </Button>
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
              <Button
                onClick={handleLoading}
                isLoading={isLoading}
                variant="primary"
                size="md"
                as="a"
                href="/api/auth/login"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
