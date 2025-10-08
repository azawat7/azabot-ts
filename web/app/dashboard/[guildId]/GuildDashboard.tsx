"use client";

import {
  ModuleSettings,
  getCommandsGroupedByCategory,
  ALL_MODULE_CONFIGS,
} from "@shaw/types";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useGuildDetails, useGuildContext } from "@/app/contexts/GuildContext";
import { useCSRF } from "@/app/hooks/useCSRF";

import { GuildDashboardSkeleton } from "@/app/components/ui/Skeleton";
import { ActionButton } from "@/app/components/ui/ActionButton";

import * as HeroIcons from "react-icons/hi2";
import { HiOutlineArrowPath, HiXMark } from "react-icons/hi2";

export default function GuildDashboard() {
  const params = useParams();
  const guildId = params.guildId as string;
  const { guildDetails, loading, error, clearGuildDetails } =
    useGuildDetails(guildId);
  const { fetchGuildDetails, toggleModule, toggleCommand } = useGuildContext();
  const { getHeaders } = useCSRF();
  const [togglingModule, setTogglingModule] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingCommand, setTogglingCommand] = useState<string | null>(null);
  const [commandToggleError, setCommandToggleError] = useState<string | null>(
    null
  );
  const [refreshButtonLoading, setRefreshButtonLoading] = useState(false);

  useEffect(() => {
    if (!guildDetails && !loading && !error) {
      fetchGuildDetails(guildId);
    }
  }, [guildId, guildDetails, loading, error, fetchGuildDetails]);

  const handleRefresh = async () => {
    try {
      setRefreshButtonLoading(true);
      const headers = await getHeaders();
      await fetch(`/api/guilds/${guildId}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      clearGuildDetails();
      await fetchGuildDetails(guildId);
    } catch (err) {
      console.error("Failed to refresh guild data:", err);
    } finally {
      setRefreshButtonLoading(false);
    }
  };

  const handleToggleModule = async (moduleKey: keyof ModuleSettings) => {
    setTogglingModule(moduleKey);
    setToggleError(null);

    try {
      const headers = await getHeaders();
      const csrfToken = headers["x-csrf-token"];

      if (!csrfToken) {
        throw new Error("Failed to get CSRF token");
      }

      await toggleModule(guildId, moduleKey, csrfToken);
    } catch (err) {
      setToggleError(moduleKey);
      console.error("Error toggling module:", err);

      setTimeout(() => {
        setToggleError(null);
      }, 2000);
    } finally {
      setTogglingModule(null);
    }
  };

  const handleToggleCommand = async (commandName: string) => {
    setTogglingCommand(commandName);
    setCommandToggleError(null);

    try {
      const headers = await getHeaders();
      const csrfToken = headers["x-csrf-token"];

      if (!csrfToken) {
        throw new Error("Failed to get CSRF token");
      }

      await toggleCommand(guildId, commandName, csrfToken);
    } catch (err) {
      setCommandToggleError(commandName);
      console.error("Error toggling command:", err);

      setTimeout(() => {
        setCommandToggleError(null);
      }, 2000);
    } finally {
      setTogglingCommand(null);
    }
  };

  if (loading) {
    return <GuildDashboardSkeleton />;
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
    <div className="flex flex-col h-full">
      {/* Guild Information Container */}
      <div className="py-6 rounded-2xl select-none flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Server Information
          </h2>{" "}
          <ActionButton
            size="md"
            onAction={handleRefresh}
            isLoading={refreshButtonLoading}
          />
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-7 ">
            {guildDetails.info.icon ? (
              <img
                src={`https://cdn.discordapp.com/icons/${guildDetails.info.id}/${guildDetails.info.icon}.png?size=128`}
                alt={`${guildDetails.info.name} icon`}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
                <span className="text-primary-text text-xl font-bold">
                  {guildDetails.info.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-secondary-text text-sm">Server Name</p>
              <p className="text-primary-text text-lg font-medium select-text">
                {guildDetails.info.name}
              </p>
            </div>
          </div>
          <div className="h-12 w-px bg-default-border" />
          <div>
            <p className="text-secondary-text text-sm">Server ID</p>
            <p className="text-primary-text text-lg font-mono select-text">
              {guildDetails.info.id}
            </p>
          </div>
        </div>
      </div>

      {/* Modules and Commands Grid */}
      <div className="flex justify-between gap-6 w-full min-h-0">
        {/* Modules Container */}
        <div className="py-6 rounded-2xl select-none flex-1/2 flex-col min-h-0 bg-secondary-background border border-default-border px-6">
          <h2 className="text-2xl font-semibold text-white mb-4 flex-shrink-0">
            Modules
          </h2>
          {guildDetails.modules ? (
            <div className="space-y-3 overflow-y-auto flex-1">
              {(
                Object.keys(ALL_MODULE_CONFIGS) as Array<keyof ModuleSettings>
              ).map((moduleKey) => {
                const moduleConfig =
                  ALL_MODULE_CONFIGS[
                    moduleKey as keyof typeof ALL_MODULE_CONFIGS
                  ];
                const moduleSettings =
                  guildDetails.modules?.[
                    moduleKey as keyof typeof guildDetails.modules
                  ];
                const isEnabled = moduleSettings?.enabled ?? false;
                const isToggling = togglingModule === moduleKey;
                const hasError = toggleError === moduleKey;

                const IconComponent = moduleConfig.reactIconName
                  ? (HeroIcons as any)[moduleConfig.reactIconName]
                  : null;

                return (
                  <div
                    key={moduleKey}
                    className="flex items-center justify-between p-4 rounded-lg bg-primary-background border border-default-border hover:border-hover-border transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        {IconComponent ? (
                          <IconComponent className="text-sky-500 text-2xl" />
                        ) : (
                          <span className="text-sky-500 text-xl">
                            {moduleConfig.icon}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-primary-text font-medium">
                          {moduleConfig.name}
                        </h3>
                        <p className="text-secondary-text text-sm">
                          {moduleConfig.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isToggling && (
                        <HiOutlineArrowPath className="w-4 h-4 text-secondary-text animate-spin [animation-duration:1.5s]" />
                      )}
                      {hasError && !isToggling && (
                        <HiXMark className="w-5 h-5 text-red-500" />
                      )}
                      <label
                        className={`relative inline-flex items-center ${
                          isToggling ? "cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isEnabled}
                          disabled={isToggling}
                          onChange={() => handleToggleModule(moduleKey)}
                        />
                        <div
                          className={`w-11 h-6 bg-default-component  rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700 ${
                            isToggling ? "opacity-50" : ""
                          }`}
                        ></div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-neutral-400">
              No module configuration available
            </p>
          )}
        </div>

        {/* Commands Container */}
        <div className="flex-1/2 py-6 rounded-2xl  select-none flex flex-col min-h-0 bg-secondary-background border border-default-border px-6">
          <h2 className="text-2xl font-semibold text-primary-text mb-4 flex-shrink-0">
            Commands
          </h2>
          <div className="space-y-4 overflow-y-auto flex-1">
            {Object.entries(getCommandsGroupedByCategory()).map(
              ([category, commands]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-lg font-medium text-secondary-text capitalize">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {commands.map((command) => {
                      const isToggling = togglingCommand === command.name;
                      const hasError = commandToggleError === command.name;
                      const isDisabled =
                        guildDetails.disabledCommands?.includes(command.name) ??
                        false;

                      return (
                        <div
                          key={command.name}
                          className="flex items-center justify-between p-4 rounded-lg bg-primary-background border border-default-border hover:border-hover-border transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <span className="text-purple-500 text-xl font-mono">
                                /
                              </span>
                            </div>
                            <div>
                              <h4 className="text-primary-text font-medium font-mono">
                                {command.name}
                              </h4>
                              <p className="text-secondary-text text-sm">
                                {command.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isToggling && (
                              <HiOutlineArrowPath className="w-4 h-4 text-secondary-text animate-spin [animation-duration:1.5s]" />
                            )}
                            {hasError && !isToggling && (
                              <HiXMark className="w-5 h-5 text-red-500" />
                            )}
                            <label
                              className={`relative inline-flex items-center ${
                                isToggling
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={!isDisabled}
                                disabled={isToggling}
                                onChange={() =>
                                  handleToggleCommand(command.name)
                                }
                              />
                              <div
                                className={`w-11 h-6 bg-default-component  rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700 ${
                                  isToggling ? "opacity-50" : ""
                                }`}
                              ></div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
