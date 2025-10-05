"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ModuleSettings } from "@shaw/types";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

interface GuildWithPermissions extends Guild {
  permissions: string;
}

interface GuildDetails {
  info: Guild;
  modules: ModuleSettings | null;
}

interface GuildContextState {
  adminGuilds: GuildWithPermissions[];
  adminGuildsLoading: boolean;
  adminGuildsError: string | null;

  guildDetails: Record<string, GuildDetails>;
  guildDetailsLoading: Record<string, boolean>;
  guildDetailsError: Record<string, string | null>;
}

interface GuildContextType extends GuildContextState {
  fetchAdminGuilds: () => Promise<void>;
  fetchGuildDetails: (guildId: string) => Promise<void>;
  toggleModule: (
    guildId: string,
    module: keyof ModuleSettings,
    csrfToken: string
  ) => Promise<void>;

  clearAdminGuilds: () => void;
  clearGuildDetails: (guildId: string) => void;
  clearAll: () => void;
}

const GuildContext = createContext<GuildContextType | undefined>(undefined);

export function GuildProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuildContextState>({
    adminGuilds: [],
    adminGuildsLoading: false,
    adminGuildsError: null,
    guildDetails: {},
    guildDetailsLoading: {},
    guildDetailsError: {},
  });

  const fetchAdminGuilds = useCallback(async (): Promise<void> => {
    setState((prev) => ({
      ...prev,
      adminGuildsLoading: true,
      adminGuildsError: null,
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
      const guilds = data.guilds || [];

      setState((prev) => ({
        ...prev,
        adminGuilds: guilds,
        adminGuildsLoading: false,
        adminGuildsError: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch admin guilds";

      setState((prev) => ({
        ...prev,
        adminGuilds: [],
        adminGuildsLoading: false,
        adminGuildsError: errorMessage,
      }));
    }
  }, []);

  const fetchGuildDetails = useCallback(
    async (guildId: string): Promise<void> => {
      setState((prev) => ({
        ...prev,
        guildDetailsLoading: {
          ...prev.guildDetailsLoading,
          [guildId]: true,
        },
        guildDetailsError: {
          ...prev.guildDetailsError,
          [guildId]: null,
        },
      }));

      try {
        const response = await fetch(`/api/guilds/${guildId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to fetch guild ${guildId}`
          );
        }

        const guildDetails: GuildDetails = await response.json();

        setState((prev) => ({
          ...prev,
          guildDetails: {
            ...prev.guildDetails,
            [guildId]: guildDetails,
          },
          guildDetailsLoading: {
            ...prev.guildDetailsLoading,
            [guildId]: false,
          },
          guildDetailsError: {
            ...prev.guildDetailsError,
            [guildId]: null,
          },
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to fetch guild ${guildId}`;

        setState((prev) => ({
          ...prev,
          guildDetailsLoading: {
            ...prev.guildDetailsLoading,
            [guildId]: false,
          },
          guildDetailsError: {
            ...prev.guildDetailsError,
            [guildId]: errorMessage,
          },
        }));
      }
    },
    []
  );

  const toggleModule = useCallback(
    async (
      guildId: string,
      module: keyof ModuleSettings,
      csrfToken: string
    ): Promise<void> => {
      try {
        const response = await fetch(`/api/guilds/${guildId}/modules`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({ module }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to toggle module ${module}`
          );
        }

        const data = await response.json();

        setState((prev) => {
          const currentGuildDetails = prev.guildDetails[guildId];
          if (!currentGuildDetails) return prev;

          return {
            ...prev,
            guildDetails: {
              ...prev.guildDetails,
              [guildId]: {
                ...currentGuildDetails,
                modules: data.modules,
              },
            },
          };
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to toggle module ${module}`;

        throw new Error(errorMessage);
      }
    },
    []
  );

  const clearAdminGuilds = useCallback(() => {
    setState((prev) => ({
      ...prev,
      adminGuilds: [],
      adminGuildsLoading: false,
      adminGuildsError: null,
    }));
  }, []);

  const clearGuildDetails = useCallback((guildId: string) => {
    setState((prev) => {
      const newGuildDetails = { ...prev.guildDetails };
      const newGuildDetailsLoading = { ...prev.guildDetailsLoading };
      const newGuildDetailsError = { ...prev.guildDetailsError };

      delete newGuildDetails[guildId];
      delete newGuildDetailsLoading[guildId];
      delete newGuildDetailsError[guildId];

      return {
        ...prev,
        guildDetails: newGuildDetails,
        guildDetailsLoading: newGuildDetailsLoading,
        guildDetailsError: newGuildDetailsError,
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState({
      adminGuilds: [],
      adminGuildsLoading: false,
      adminGuildsError: null,
      guildDetails: {},
      guildDetailsLoading: {},
      guildDetailsError: {},
    });
  }, []);

  const contextValue: GuildContextType = {
    ...state,
    fetchAdminGuilds,
    fetchGuildDetails,
    toggleModule,
    clearAdminGuilds,
    clearGuildDetails,
    clearAll,
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
  const {
    adminGuilds,
    adminGuildsLoading,
    adminGuildsError,
    fetchAdminGuilds,
    clearAdminGuilds,
  } = useGuildContext();

  return {
    adminGuilds,
    loading: adminGuildsLoading,
    error: adminGuildsError,
    fetchAdminGuilds,
    clearAdminGuilds,
  };
}

export function useGuildDetails(guildId?: string) {
  const {
    guildDetails,
    guildDetailsLoading,
    guildDetailsError,
    fetchGuildDetails,
    clearGuildDetails,
  } = useGuildContext();

  if (!guildId) {
    return {
      guildDetails: null,
      loading: false,
      error: null,
      fetchGuildDetails,
      clearGuildDetails: () => {},
    };
  }

  return {
    guildDetails: guildDetails[guildId] || null,
    loading: guildDetailsLoading[guildId] || false,
    error: guildDetailsError[guildId] || null,
    fetchGuildDetails: () => fetchGuildDetails(guildId),
    clearGuildDetails: () => clearGuildDetails(guildId),
  };
}
