"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { useAuthContext } from "./contexts/AuthContext";
import { HiArrowRight } from "react-icons/hi2";

export default function Home() {
  const { isAuthenticated } = useAuthContext();
  if (isAuthenticated) {
    return redirect("/dashboard");
  }

  const handleLogin = async () => {
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col space-y-3 select-none">
        <h1 className="text-xl text-secondary-text mb-6">AllBot</h1>
        <p className="text-2xl text-primary-text font-normal">Sign In</p>

        <button
          onClick={handleLogin}
          className="text-secondary-text hover:text-primary-text transition-colors duration-200 text-sm flex items-center gap-2 group cursor-pointer"
        >
          Continue with Discord
          <HiArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
