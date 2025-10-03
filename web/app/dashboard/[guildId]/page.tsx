"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface GuildDetails {
  info: { id: string; name: string; icon: string | null };
  modules: GuildSettings;
}

interface GuildSettings {
  levelModule: {
    enabled: boolean;
  };
}

export default function GuildDashboardPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [guild, setGuild] = useState<GuildDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuildData = async () => {
    try {
      const guildResponse = await fetch(`/api/guilds/${guildId}`, {
        credentials: "include",
      });

      if (!guildResponse.ok) {
        throw new Error("Failed to fetch guild data");
      }
      const guildData = await guildResponse.json();
      console.log(guildData);
      setGuild(guildData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load guild data"
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (guildId) {
      fetchGuildData();
    }
  }, [guildId]);

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

      {!loading && !error && guild && <>{guild.info.name}</>}
    </>
  );
}
