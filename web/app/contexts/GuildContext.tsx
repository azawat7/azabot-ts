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

interface GuildWithPermissions extends Guild {
  permissions: string;
}

interface GuildDetails {
  info: Guild;
  modules: ModuleSettings | null;
}

interface GuildContextState {
  currentGuild: Guild | null;
  currentGuildDetails: GuildDetails | null;

  adminGuilds: GuildWithPermissions[];

  loading: {
    currentGuild: boolean;
    adminGuilds: boolean;
  };

  error: {
    currentGuild: string | null;
    adminGuilds: string | null;
  };
}

interface GuildContextType extends GuildContextState {
  fetchGuildWithPermissions: (guildId: string) => Promise<boolean>;
  clearCurrentGuild: () => void;

  fetchAdminGuilds: () => Promise<void>;
  clearAdminGuilds: () => void;

  clearAllCache: () => void;

  isGuildAdmin: (guildId: string) => boolean;
  getGuildFromAdminList: (guildId: string) => GuildWithPermissions | null;
}

const CACHE_EXPIRY = 15 * 60 * 1000;
const ADMIN_GUILDS_CACHE_KEY = "admin-guilds-cache";
const GUILD_DETAILS_CACHE_PREFIX = "guild-details-";

const GuildContext = createContext<GuildContextType | undefined>(undefined);

export function GuildProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuildContextState>({
    currentGuild: null,
    currentGuildDetails: null,
    adminGuilds: [],
    loading: {
      currentGuild: false,
      adminGuilds: false,
    },
    error: {
      currentGuild: null,
      adminGuilds: null,
    },
  });

  const fetchingGuildRef = useRef<string | null>(null);
  const currentGuildIdRef = useRef<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const getCachedData = (key: string): any => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      if (parsed.timestamp && Date.now() - parsed.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error(`Failed to get cached data for ${key}:`, error);
      return null;
    }
  };

  const setCachedData = (key: string, data: any): void => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Failed to cache data for ${key}:`, error);
    }
  };

  const clearCache = (pattern: string): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error(`Failed to clear cache for pattern ${pattern}:`, error);
    }
  };

  const fetchAdminGuilds = useCallback(async (): Promise<void> => {
    const cachedAdminGuilds = getCachedData(ADMIN_GUILDS_CACHE_KEY) as
      | GuildWithPermissions[]
      | null;
    if (cachedAdminGuilds) {
      setState((prev) => ({
        ...prev,
        adminGuilds: cachedAdminGuilds,
        loading: { ...prev.loading, adminGuilds: false },
        error: { ...prev.error, adminGuilds: null },
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: { ...prev.loading, adminGuilds: true },
      error: { ...prev.error, adminGuilds: null },
    }));

    try {
      const response = await fetch("/api/guilds", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch admin guilds");
      }

      const data = await response.json();
      const adminGuilds = data.guilds || [];

      setState((prev) => ({
        ...prev,
        adminGuilds,
        loading: { ...prev.loading, adminGuilds: false },
        error: { ...prev.error, adminGuilds: null },
      }));

      setCachedData(ADMIN_GUILDS_CACHE_KEY, adminGuilds);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch admin guilds";
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, adminGuilds: false },
        error: { ...prev.error, adminGuilds: errorMessage },
      }));
    }
  }, []);

  const fetchGuildWithPermissions = useCallback(
    async (guildId: string): Promise<boolean> => {
      if (fetchingGuildRef.current === guildId) {
        return false;
      }

      const adminGuild = state.adminGuilds.find(
        (guild) => guild.id === guildId
      );
      if (!adminGuild) {
        setState((prev) => ({
          ...prev,
          error: {
            ...prev.error,
            currentGuild: "You don't have admin permissions for this server",
          },
        }));
        return false;
      }

      const cacheKey = `${GUILD_DETAILS_CACHE_PREFIX}${guildId}`;
      const cachedGuildDetails = getCachedData(cacheKey) as GuildDetails | null;
      if (cachedGuildDetails) {
        setState((prev) => ({
          ...prev,
          currentGuild: cachedGuildDetails.info,
          currentGuildDetails: cachedGuildDetails,
          loading: { ...prev.loading, currentGuild: false },
          error: { ...prev.error, currentGuild: null },
        }));
        return true;
      }

      fetchingGuildRef.current = guildId;
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, currentGuild: true },
        error: { ...prev.error, currentGuild: null },
      }));

      try {
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
            return false;
          }

          throw new Error(errorData.message || "Failed to fetch guild data");
        }

        const guildDetails: GuildDetails = await response.json();

        setState((prev) => ({
          ...prev,
          currentGuild: guildDetails.info,
          currentGuildDetails: guildDetails,
          loading: { ...prev.loading, currentGuild: false },
          error: { ...prev.error, currentGuild: null },
        }));

        setCachedData(cacheKey, guildDetails);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load guild data";
        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, currentGuild: false },
          error: { ...prev.error, currentGuild: errorMessage },
          currentGuild: null,
          currentGuildDetails: null,
        }));
        return false;
      } finally {
        fetchingGuildRef.current = null;
      }
    },
    [state.adminGuilds, router]
  );

  const isGuildAdmin = useCallback(
    (guildId: string): boolean => {
      return state.adminGuilds.some((guild) => guild.id === guildId);
    },
    [state.adminGuilds]
  );

  const getGuildFromAdminList = useCallback(
    (guildId: string): GuildWithPermissions | null => {
      return state.adminGuilds.find((guild) => guild.id === guildId) || null;
    },
    [state.adminGuilds]
  );

  const clearCurrentGuild = useCallback(() => {
    currentGuildIdRef.current = null;
    setState((prev) => ({
      ...prev,
      currentGuild: null,
      currentGuildDetails: null,
      error: { ...prev.error, currentGuild: null },
    }));
  }, []);

  const clearAdminGuilds = useCallback(() => {
    setState((prev) => ({
      ...prev,
      adminGuilds: [],
      error: { ...prev.error, adminGuilds: null },
    }));
    localStorage.removeItem(ADMIN_GUILDS_CACHE_KEY);
  }, []);

  const clearAllCache = useCallback(() => {
    clearCache(ADMIN_GUILDS_CACHE_KEY);
    clearCache(GUILD_DETAILS_CACHE_PREFIX);
    setState((prev) => ({
      ...prev,
      currentGuild: null,
      currentGuildDetails: null,
      adminGuilds: [],
      error: { currentGuild: null, adminGuilds: null },
    }));
  }, []);

  useEffect(() => {
    fetchAdminGuilds();
  }, [fetchAdminGuilds]);

  useEffect(() => {
    const isGuildPage = pathname.match(/^\/dashboard\/[^\/]+$/);
    const isModulePage = pathname.match(/^\/dashboard\/[^\/]+\/[^\/]+$/);
    const isMainDashboard = pathname === "/dashboard";

    if (isMainDashboard) {
      currentGuildIdRef.current = null;
      clearCurrentGuild();
    } else if (isGuildPage || isModulePage) {
      const guildId = pathname.split("/")[2];

      if (currentGuildIdRef.current !== guildId) {
        clearCurrentGuild();
        currentGuildIdRef.current = guildId;
      }

      if (state.loading.adminGuilds) {
        return;
      }

      if (currentGuildIdRef.current === guildId && !state.currentGuild) {
        if (isGuildAdmin(guildId)) {
          fetchGuildWithPermissions(guildId);
        } else {
          setState((prev) => ({
            ...prev,
            error: {
              ...prev.error,
              currentGuild: "You don't have admin permissions for this server",
            },
          }));
        }
      }
    }
  }, [
    pathname,
    fetchGuildWithPermissions,
    isGuildAdmin,
    clearCurrentGuild,
    state.loading.adminGuilds,
    state.currentGuild,
  ]);

  const contextValue: GuildContextType = {
    ...state,
    fetchGuildWithPermissions,
    clearCurrentGuild,
    fetchAdminGuilds,
    clearAdminGuilds,
    clearAllCache,
    isGuildAdmin,
    getGuildFromAdminList,
  };

  return (
    <GuildContext.Provider value={contextValue}>
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

export function useAdminGuilds() {
  const { adminGuilds, loading, error, fetchAdminGuilds, clearAdminGuilds } =
    useGuildContext();
  return {
    adminGuilds,
    loading: loading.adminGuilds,
    error: error.adminGuilds,
    fetchAdminGuilds,
    clearAdminGuilds,
  };
}

export function useCurrentGuild() {
  const {
    currentGuild,
    currentGuildDetails,
    loading,
    error,
    fetchGuildWithPermissions,
    clearCurrentGuild,
  } = useGuildContext();
  return {
    currentGuild,
    currentGuildDetails,
    loading: loading.currentGuild,
    error: error.currentGuild,
    fetchGuildWithPermissions,
    clearCurrentGuild,
  };
}
