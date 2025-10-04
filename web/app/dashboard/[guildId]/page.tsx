"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ModuleSettings } from "@shaw/types";
import { useGuildContext } from "../../contexts/GuildContext";

export default function GuildDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;
  const { guildDetails, loading, error } = useGuildContext();

  return (
    <>
      {loading && (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-800"></div>
        </div>
      )}

      {!loading && error && (
        <div className="border-1 border-red-500 bg-red-500/10 rounded-lg p-8 mb-6 text-center">
          <p className="text-red-500">{error}</p>
          <Link href="/dashboard" className="text-sky-500 hover:text-sky-400">
            Return to Dashboard
          </Link>
        </div>
      )}

      {!loading && !error && guildDetails && <>{guildDetails.info.name}</>}
    </>
  );
}
