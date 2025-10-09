"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { HiMagnifyingGlass } from "react-icons/hi2";

import { useAuthContext } from "@/app/contexts/AuthContext";
import { useAdminGuilds } from "@/app/contexts/GuildContext";
import { useCSRF } from "@/app/hooks/useCSRF";

import { ActionButton } from "@/app/components/ui/ActionButton";
import { GuildCardSkeleton } from "@/app/components/ui/Skeleton";
import { getPermissionLevel } from "@/app/lib/utils/permissions";
import { generateDiscordInviteUrl } from "@/app/lib/utils/invite";

export default function Dashboard() {
  const { user } = useAuthContext();
  const { adminGuilds, loading, error, fetchAdminGuilds, clearAdminGuilds } =
    useAdminGuilds();
  const { getHeaders } = useCSRF();
  const [refreshButtonLoading, setRefreshButtonLoading] = useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGuilds = useMemo(() => {
    if (!searchTerm.trim()) return adminGuilds;
    return adminGuilds.filter((guild) =>
      guild.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [adminGuilds, searchTerm]);

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
      fetchAdminGuilds(false); // TODO FOR PROD CHANGE TO TRUE
      setHasInitiallyFetched(true);
    }
  }, [adminGuilds.length, loading, error, fetchAdminGuilds]);

  return (
    <div className="max-w-[100rem] mx-auto">
      <div className="text-3xl mb-4 text-primary-text">
        Welcome back, {user?.username}.
      </div>
      <p className="text-secondary-text mb-6">
        Dont see your server? Make sure you have the at least the Manage Server
        permission and make sure the bot is in your server.
      </p>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text">
            <HiMagnifyingGlass size={20} />
          </div>
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 h-10 bg-secondary-background border border-default-border rounded-lg text-primary-text placeholder-secondary-text focus:outline-none focus:border-hover-border transition-colors"
          />
        </div>
        <ActionButton
          size="md"
          onAction={handleRefresh}
          isLoading={refreshButtonLoading}
          variant="icon"
          className="border-1 border-default-border"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
        <div className="border-1 border-default-border bg-secondary-background rounded-lg p-8 text-center">
          <p className="text-secondary-text">
            No servers found. Make sure the bot is in your server!
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        adminGuilds.length > 0 &&
        filteredGuilds.length === 0 &&
        searchTerm.trim() && (
          <div className="border-1 border-default-border bg-secondary-background rounded-lg p-8 text-center">
            <p className="text-secondary-text">
              No servers found matching "{searchTerm}".
            </p>
          </div>
        )}

      {!loading && !error && filteredGuilds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredGuilds.map((guild) => {
            const permissionLevel = getPermissionLevel(guild.permissions);
            return (
              <div
                key={guild.id}
                className="bg-secondary-background rounded-lg p-4 transition-colors border border-default-border hover:border-hover-border space-y-4"
              >
                <div className="flex items-center gap-4">
                  {guild.icon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                      alt={guild.name}
                      className="w-16 h-16 rounded-lg border border-default-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-primary-text">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-semibold truncate text-primary-text"
                      title={guild.name}
                    >
                      {guild.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-3 py-0 rounded-full text-sm font-light ${
                          guild.owner
                            ? "border border-amber-500/20 text-amber-500 bg-amber-500/10"
                            : permissionLevel === "admin"
                            ? "border border-sky-500/20 text-sky-500 bg-sky-500/10"
                            : "border border-blue-500/20 text-blue-500 bg-blue-500/10"
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
                </div>
                <Link
                  href={
                    guild.botInServer
                      ? `/dashboard/${guild.id}`
                      : generateDiscordInviteUrl(
                          process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
                          guild.id
                        )
                  }
                  className="text-secondary-text hover:text-primary-text bg-default-component hover:bg-hover-component border border-default-border hover:border-hover-border rounded-md py-2 text-center w-full block"
                >
                  {guild.botInServer ? "Manage Server" : "Invite Bot"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
