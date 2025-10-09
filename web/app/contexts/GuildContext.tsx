"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ModuleSettings, LevelModuleSettings, UserGuild } from "@shaw/types";
import { CachedRole, CachedChannel } from "@/app/lib/discord/guild.service";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

interface GuildDetails {
  info: Guild;
  modules: {
    leveling?: LevelModuleSettings;
  } | null;
  disabledCommands: string[];
  roles: CachedRole[];
  channels: CachedChannel[];
}

interface GuildContextState {
  adminGuilds: UserGuild[];
  adminGuildsLoading: boolean;
  adminGuildsError: string | null;

  guildDetails: Record<string, GuildDetails>;
  guildDetailsLoading: Record<string, boolean>;
  guildDetailsError: Record<string, string | null>;
}

interface GuildContextType extends GuildContextState {
  fetchAdminGuilds: (forceRefresh?: boolean) => Promise<void>;
  fetchGuildDetails: (guildId: string) => Promise<void>;
  toggleModule: (
    guildId: string,
    module: keyof ModuleSettings,
    csrfToken: string
  ) => Promise<void>;
  toggleCommand: (
    guildId: string,
    commandName: string,
    csrfToken: string
  ) => Promise<void>;
  updateModuleSettings: (
    guildId: string,
    module: keyof ModuleSettings,
    settings: Record<string, any>,
    csrfToken: string
  ) => Promise<{
    success: boolean;
    validationErrors?: any[];
    message?: string;
  }>;

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

  const fetchAdminGuilds = useCallback(
    async (forceRefresh: boolean = false): Promise<void> => {
      setState((prev) => ({
        ...prev,
        adminGuildsLoading: true,
        adminGuildsError: null,
      }));

      try {
        const response = await fetch(
          `/api/guilds?forceRefresh=${forceRefresh}`,
          {
            credentials: "include",
          }
        );

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
          error instanceof Error
            ? error.message
            : "Failed to fetch admin guilds";

        setState((prev) => ({
          ...prev,
          adminGuilds: [],
          adminGuildsLoading: false,
          adminGuildsError: errorMessage,
        }));
      }
    },
    []
  );

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

  const toggleCommand = useCallback(
    async (
      guildId: string,
      commandName: string,
      csrfToken: string
    ): Promise<void> => {
      try {
        const response = await fetch(`/api/guilds/${guildId}/commands`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({ commandName }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to toggle command ${commandName}`
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
                disabledCommands: data.disabledCommands || [],
              },
            },
          };
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to toggle command ${commandName}`;

        throw new Error(errorMessage);
      }
    },
    []
  );

  const updateModuleSettings = useCallback(
    async (
      guildId: string,
      module: keyof ModuleSettings,
      settings: Record<string, any>,
      csrfToken: string
    ): Promise<{
      success: boolean;
      validationErrors?: any[];
      message?: string;
    }> => {
      try {
        const response = await fetch(
          `/api/guilds/${guildId}/modules/settings`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({
              module,
              settings,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            validationErrors: data.validationErrors,
            message: data.message || "Failed to save module settings",
          };
        }

        setState((prev) => {
          const currentGuildDetails = prev.guildDetails[guildId];
          if (!currentGuildDetails) return prev;

          const updatedGuildDetails: GuildDetails = {
            ...currentGuildDetails,
            modules: {
              ...currentGuildDetails.modules,
              ...(module === "leveling"
                ? {
                    leveling: {
                      enabled: Boolean(
                        currentGuildDetails.modules?.leveling?.enabled ?? false
                      ),
                      ...data.settings,
                    } as LevelModuleSettings,
                  }
                : {}),
            },
          };

          return {
            ...prev,
            guildDetails: {
              ...prev.guildDetails,
              [guildId]: updatedGuildDetails,
            },
          };
        });

        return {
          success: true,
          message: data.message || "Module settings saved successfully",
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Network error occurred while saving settings";

        return {
          success: false,
          message: errorMessage,
        };
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
    toggleCommand,
    updateModuleSettings,
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
