"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuthContext } from "@/app/contexts/AuthContext";
import { useAdminGuilds } from "@/app/contexts/GuildContext";
import { useCSRF } from "@/app/hooks/useCSRF";

import { ActionButton } from "@/app/components/ui/ActionButton";
import { GuildCardSkeleton } from "@/app/components/ui/Skeleton";
import { getPermissionLevel } from "@/app/lib/utils/permissions";
import { HiArrowPath } from "react-icons/hi2";

export default function Dashboard() {
  const { user } = useAuthContext();
  const { adminGuilds, loading, error, fetchAdminGuilds, clearAdminGuilds } =
    useAdminGuilds();
  const { getHeaders } = useCSRF();
  const [refreshButtonLoading, setRefreshButtonLoading] = useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshButtonLoading(true);
      const headers = await getHeaders();
      await fetch("/api/guilds", {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      clearAdminGuilds();
      setHasInitiallyFetched(false);
      await fetchAdminGuilds();
    } catch (err) {
      console.error("Failed to refresh guilds:", err);
    } finally {
      setRefreshButtonLoading(false);
    }
  };

  useEffect(() => {
    if (adminGuilds.length <= 1 && !loading && !error && !hasInitiallyFetched) {
      fetchAdminGuilds(false); // CHANGE TO TRUE
      setHasInitiallyFetched(true);
    }
  }, [adminGuilds.length, loading, error, fetchAdminGuilds]);

  return (
    <>
      <div className="flex justify-between items-center gap-4">
        <div className="text-3xl mb-4 text-primary-text">
          Welcome back, {user?.username}.
        </div>
        <ActionButton
          size="md"
          onAction={handleRefresh}
          isLoading={refreshButtonLoading}
          variant="icon"
        />
      </div>
      <p className="text-secondary-text mb-6">
        Dont see your server? Make sure you have the at least the Manage Server
        permission.
      </p>

      <div className="border-b-1 my-6 border-default-border"></div>

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

      {!loading && !error && adminGuilds.length === 0 && (
        <div className="border-1 border-zinc-700 bg-zinc-900 rounded-lg p-8 text-center">
          <p className="text-neutral-400">
            No servers found. Make sure the bot is in your server!
          </p>
        </div>
      )}

      {!loading && !error && adminGuilds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminGuilds.map((guild) => {
            const permissionLevel = getPermissionLevel(guild.permissions);
            console.log(permissionLevel);
            return (
              <Link
                key={guild.id}
                href={`/dashboard/${guild.id}`}
                className="bg-secondary-background rounded-lg p-6 transition-colors border border-default-border hover:border-hover-border"
              >
                <div className="flex items-center gap-4">
                  {guild.icon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                      alt={guild.name}
                      className="w-16 h-16 rounded-2xl border border-default-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-primary-text">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 ">
                    <h3 className="text-lg font-semibold truncate text-primary-text">
                      {guild.name}
                    </h3>
                    <span
                      className={`inline-block px-3 py-0 rounded-full text-sm font-light ${
                        guild.owner
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : permissionLevel === "admin"
                          ? "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}
                    >
                      {guild.owner
                        ? "Owner"
                        : permissionLevel === "admin"
                        ? "Administrator"
                        : "Manage Server"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
