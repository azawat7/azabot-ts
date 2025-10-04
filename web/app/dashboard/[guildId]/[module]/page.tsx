"use client";

import Link from "next/link";
import { useCurrentGuild } from "../../../contexts/GuildContext";

export default function GuildModulePage() {
  const { currentGuildDetails, loading, error } = useCurrentGuild();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-1 border-red-500 bg-red-500/10 rounded-lg p-8 mb-6 text-center">
        <p className="text-red-500">{error}</p>
        <Link href="/dashboard" className="text-sky-500 hover:text-sky-400">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!currentGuildDetails) {
    return (
      <div className="border-1 border-zinc-700 bg-zinc-900 rounded-lg p-8 text-center">
        <p className="text-neutral-400">Guild not found</p>
        <Link href="/dashboard" className="text-sky-500 hover:text-sky-400">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return <div>test</div>;
}
