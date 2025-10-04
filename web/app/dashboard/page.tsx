"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { useGuildContext } from "../contexts/GuildContext";
import Link from "next/link";
import { useCSRF } from "../hooks/useCSRF";
import { RefreshButton } from "../components/ui/RefreshButton";
import { GuildCardSkeleton } from "../components/ui/Skeleton";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

export default function DashboardPage({}: {}) {
  const { user } = useAuthContext();
  const { cacheGuildList } = useGuildContext();
  const { getHeaders } = useCSRF();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchGuilds = async () => {
    try {
      setError(null);
      const response = await fetch("/api/guilds", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch guilds");
      }

      const data = await response.json();
      const guildsList = data.guilds || [];
      setGuilds(guildsList);
      setIsCached(data.cached || false);

      if (guildsList.length > 0) {
        cacheGuildList(guildsList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load guilds");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setLoading(true);
    setIsRefreshing(true);
    try {
      const headers = await getHeaders();
      await fetch("/api/guilds", {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      await fetchGuilds();
    } catch (err) {
      setError("Failed to refresh guilds");
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  return (
    <>
      <div className="text-4xl font-bold mb-6 text-white">Dashboard</div>
      <div className="px-8 py-8 rounded-2xl border-1 border-zinc-700">
        <div>
          <div className="flex justify-between items-center gap-4">
            <p className="text-white text-xl">
              Welcome back, {user?.username}! Select a server to manage.
            </p>
            <RefreshButton
              size="md"
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
        <div className="border-b-1 my-6 border-zinc-700"></div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <GuildCardSkeleton />
            <GuildCardSkeleton />
            <GuildCardSkeleton />
            <GuildCardSkeleton />
            <GuildCardSkeleton />
            <GuildCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="border-1 border-red-500 bg-red-500/10 rounded-lg p-8 mb-6 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && guilds.length === 0 && (
          <div className="border-1 border-zinc-700 bg-zinc-900 rounded-lg p-8 text-center">
            <p className="text-neutral-400">
              No servers found. Make sure the bot is in your server!
            </p>
          </div>
        )}

        {!loading && !error && guilds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guilds.map((guild) => (
              <Link
                key={guild.id}
                href={`/dashboard/${guild.id}`}
                className="bg-zinc-900 hover:bg-neutral-750 rounded-lg p-6 transition-colors border border-zinc-700 hover:border-neutral-500"
              >
                <div className="flex items-center gap-4">
                  {guild.icon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                      alt={guild.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center text-2xl font-bold text-white">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate text-white">
                      {guild.name}
                    </h3>
                    <p className="text-sm text-white">Click to manage</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
