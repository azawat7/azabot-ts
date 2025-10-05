"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useGuildDetails, useGuildContext } from "../../contexts/GuildContext";
import { useEffect, useState } from "react";
import { MODULE_METADATA, ModuleSettings } from "@shaw/types";
import * as HeroIcons from "react-icons/hi2";
import { HiOutlineArrowPath, HiXMark } from "react-icons/hi2";
import { useCSRF } from "@/app/hooks/useCSRF";
import { GuildDashboardSkeleton } from "@/app/components/ui/Skeleton";

export default function GuildDashboard() {
  const params = useParams();
  const guildId = params.guildId as string;
  const { guildDetails, loading, error } = useGuildDetails(guildId);
  const { fetchGuildDetails, toggleModule } = useGuildContext();
  const { getHeaders } = useCSRF();
  const [togglingModule, setTogglingModule] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    if (!guildDetails && !loading && !error) {
      fetchGuildDetails(guildId);
    }
  }, [guildId, guildDetails, loading, error, fetchGuildDetails]);

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
      <h1 className="text-4xl font-bold mb-6 select-none flex-shrink-0">
        <span className="text-white">{guildDetails.info.name}</span>{" "}
        <span className="ml-2 text-neutral-400 text-3xl">Dashboard Page</span>
      </h1>
      {/* Guild Information Container */}
      <div className="px-8 py-6 rounded-2xl border-1 border-zinc-700 bg-zinc-900/50 mb-6 select-none flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Server Information
        </h2>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-7">
            {guildDetails.info.icon ? (
              <img
                src={`https://cdn.discordapp.com/icons/${guildDetails.info.id}/${guildDetails.info.icon}.png?size=128`}
                alt={`${guildDetails.info.name} icon`}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {guildDetails.info.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-neutral-400 text-sm">Server Name</p>
              <p className="text-white text-lg font-medium select-text">
                {guildDetails.info.name}
              </p>
            </div>
          </div>
          <div className="h-12 w-px bg-zinc-700" />
          <div>
            <p className="text-neutral-400 text-sm">Server ID</p>
            <p className="text-white text-lg font-mono select-text">
              {guildDetails.info.id}
            </p>
          </div>
          <div className="h-12 w-px bg-zinc-700" />
          <div>
            <p className="text-neutral-400 text-sm">Your Role</p>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                guildDetails.info.owner
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-sky-500/10 text-sky-500 border border-sky-500/20"
              }`}
            >
              {guildDetails.info.owner ? "👑 Owner" : "🛡️ Administrator"}
            </span>
          </div>
        </div>
      </div>

      {/* Modules and Commands Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Modules Container */}
        <div className="px-8 py-6 rounded-2xl border-1 border-zinc-700 bg-zinc-900/50 select-none flex flex-col min-h-0">
          <h2 className="text-2xl font-semibold text-white mb-4 flex-shrink-0">
            Modules
          </h2>
          {guildDetails.modules ? (
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {(
                Object.keys(MODULE_METADATA) as Array<keyof ModuleSettings>
              ).map((moduleKey) => {
                const metadata = MODULE_METADATA[moduleKey];
                const moduleSettings = guildDetails.modules![moduleKey];
                const isEnabled = moduleSettings?.enabled ?? false;
                const isToggling = togglingModule === moduleKey;
                const hasError = toggleError === moduleKey;

                const IconComponent = (HeroIcons as any)[
                  metadata.reactIconName
                ];

                return (
                  <div
                    key={moduleKey}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        {IconComponent ? (
                          <IconComponent className="text-sky-500 text-2xl" />
                        ) : (
                          <span className="text-sky-500 text-xl">
                            {metadata.emoji}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">
                          {metadata.name}
                        </h3>
                        <p className="text-neutral-400 text-sm">
                          {metadata.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isToggling && (
                        <HiOutlineArrowPath className="w-4 h-4 text-neutral-400 animate-spin [animation-duration:1.5s]" />
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
                          className={`w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700 ${
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
        <div className="px-8 py-6 rounded-2xl border-1 border-zinc-700 bg-zinc-900/50 select-none flex flex-col min-h-0">
          <h2 className="text-2xl font-semibold text-white mb-4 flex-shrink-0">
            Commands
          </h2>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {/* Example command*/}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 text-xl font-mono">/</span>
                </div>
                <div>
                  <h3 className="text-white font-medium font-mono">rank</h3>
                  <p className="text-neutral-400 text-sm">
                    View your server rank and level
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
