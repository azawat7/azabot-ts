"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { generateDiscordInviteUrl } from "../lib/utils/invite";
import { ModuleSettings } from "@shaw/types";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface GuildDetails {
  info: Guild;
  modules: ModuleSettings | null;
}

interface GuildContextType {
  guild: Guild | null;
  guildDetails: GuildDetails | null;
  loading: boolean;
  error: string | null;
  fetchGuild: (guildId: string) => Promise<void>;
  clearGuild: () => void;
  clearAllGuildCache: () => void;
  cacheGuildList: (guilds: Guild[]) => void;
}

const GuildContext = createContext<GuildContextType | undefined>(undefined);

export function GuildProvider({ children }: { children: ReactNode }) {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [guildDetails, setGuildDetails] = useState<GuildDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef<string | null>(null);
  const currentGuildIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  const getCacheKey = (guildId: string) => `guild-cache-${guildId}`;

  const getCachedGuild = (guildId: string): GuildDetails | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(guildId));
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Failed to get cached guild data:", error);
      return null;
    }
  };

  const setCachedGuild = (guildId: string, data: GuildDetails) => {
    try {
      localStorage.setItem(getCacheKey(guildId), JSON.stringify(data));
    } catch (error) {
      console.error("Failed to cache guild data:", error);
    }
  };

  const clearGuildCache = (guildId: string) => {
    try {
      localStorage.removeItem(getCacheKey(guildId));
    } catch (error) {
      console.error("Failed to clear guild cache:", error);
    }
  };

  const clearAllGuildCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("guild-cache-")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Failed to clear all guild cache:", error);
    }
  };

  const cacheGuildList = (guilds: Guild[]) => {
    try {
      guilds.forEach((guild) => {
        const basicGuildDetails: GuildDetails = {
          info: guild,
          modules: null,
        };
        setCachedGuild(guild.id, basicGuildDetails);
      });
    } catch (error) {
      console.error("Failed to cache guild list:", error);
    }
  };

  useEffect(() => {
    const handlePageLoad = () => {
      if (!hasInitializedRef.current) {
        clearAllGuildCache();
        hasInitializedRef.current = true;
      }
    };

    if (window.performance) {
      handlePageLoad();
    } else {
      hasInitializedRef.current = true;
    }
  }, []);

  const fetchGuild = useCallback(
    async (guildId: string) => {
      if (guildDetails?.info.id === guildId) {
        return;
      }

      if (fetchingRef.current === guildId) {
        return;
      }

      if (guild?.id === guildId) {
        return;
      }

      const cachedData = getCachedGuild(guildId);
      if (cachedData) {
        setGuildDetails(cachedData);
        setGuild(cachedData.info);
        return;
      }

      fetchingRef.current = guildId;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/guilds/${guildId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();

          if (
            response.status === 404 &&
            errorData.error === "BOT_NOT_IN_SERVER"
          ) {
            const clientId = process.env
              .NEXT_PUBLIC_DISCORD_CLIENT_ID as string;
            const inviteUrl = generateDiscordInviteUrl(clientId);

            window.open(inviteUrl, "_blank");

            router.push("/dashboard");
            return;
          }

          throw new Error(errorData.error || "Failed to fetch guild data");
        }

        const data = await response.json();
        setGuildDetails(data);
        setGuild(data.info);

        setCachedGuild(guildId, data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load guild data"
        );
        setGuildDetails(null);
        setGuild(null);
      } finally {
        setLoading(false);
        fetchingRef.current = null;
      }
    },
    [router]
  );

  useEffect(() => {
    const isGuildPage = pathname.match(/^\/dashboard\/[^\/]+$/);
    const isModulePage = pathname.match(/^\/dashboard\/[^\/]+\/[^\/]+$/);
    const isMainDashboard = pathname === "/dashboard";

    if (!isMainDashboard && (isGuildPage || isModulePage)) {
      const guildId = pathname.split("/")[2];

      if (currentGuildIdRef.current && currentGuildIdRef.current !== guildId) {
        setGuild(null);
        setGuildDetails(null);
        setError(null);
      }

      currentGuildIdRef.current = guildId;

      if (!guildDetails || guildDetails.info.id !== guildId) {
        fetchGuild(guildId);
      }
    } else if (isMainDashboard) {
      currentGuildIdRef.current = null;
      setGuild(null);
      setGuildDetails(null);
      setError(null);
    }
  }, [pathname, fetchGuild, guildDetails]);

  const clearGuild = () => {
    currentGuildIdRef.current = null;
    setGuild(null);
    setGuildDetails(null);
    setError(null);
    setLoading(false);
  };

  return (
    <GuildContext.Provider
      value={{
        guild,
        guildDetails,
        loading,
        error,
        fetchGuild,
        clearGuild,
        clearAllGuildCache,
        cacheGuildList,
      }}
    >
      {children}
    </GuildContext.Provider>
  );
}

export function useGuildContext() {
  const context = useContext(GuildContext);
  if (context === undefined) {
    throw new Error("useGuildContext must be used within a GuildProvider");
  }
  return context;
}
