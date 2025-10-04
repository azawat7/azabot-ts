"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useGuildDetails, useGuildContext } from "../../contexts/GuildContext";
import { useEffect } from "react";

export default function GuildDashboard() {
  const params = useParams();
  const guildId = params.guildId as string;
  const { guildDetails, loading, error } = useGuildDetails(guildId);
  const { fetchGuildDetails } = useGuildContext();

  useEffect(() => {
    if (!guildDetails && !loading && !error) {
      fetchGuildDetails(guildId);
    }
  }, [guildId, guildDetails, loading, error, fetchGuildDetails]);

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

  if (!guildDetails) {
    return (
      <div className="border-1 border-zinc-700 bg-zinc-900 rounded-lg p-8 text-center">
        <p className="text-neutral-400">Guild not found</p>
        <Link href="/dashboard" className="text-sky-500 hover:text-sky-400">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6 text-white">
        {guildDetails.info.name}
      </h1>
      <div className="px-8 py-8 rounded-2xl border-1 border-zinc-700">
        <p className="text-white text-xl">
          Welcome to the {guildDetails.info.name} dashboard!
        </p>
        <p className="text-neutral-400 mt-2">
          Select a module from the sidebar to configure your server settings.
        </p>
      </div>
    </div>
  );
}
