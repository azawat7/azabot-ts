"use client";
import { ModuleSettings, ALL_MODULE_CONFIGS } from "@shaw/types";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useGuildDetails } from "@/app/contexts/GuildContext";
import { useCSRF } from "@/app/hooks/useCSRF";

import { GuildInfoSkeleton } from "@/app/components/ui/Skeleton";
import { Breadcrumb } from "@/app/components/ui/Breadcrumb";
import { UserDropdown } from "@/app/components/layout/UserDropdown";
import { ActionButton } from "@/app/components/ui/ActionButton";

import { IoArrowBack } from "react-icons/io5";
import { HiArrowPath, HiHome } from "react-icons/hi2";
import * as HeroIcons from "react-icons/hi2";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardContent>{children}</DashboardContent>;
}

function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isMainDashboard = pathname === "/dashboard";
  const isGuildPage = pathname.match(/^\/dashboard\/[^\/]+$/);
  const isModulePage = pathname.match(/^\/dashboard\/[^\/]+\/[^\/]+$/);

  const guildId = isGuildPage || isModulePage ? pathname.split("/")[2] : null;
  const module = isModulePage ? pathname.split("/")[3] : null;

  const { guildDetails, loading, clearGuildDetails, fetchGuildDetails } =
    useGuildDetails(guildId || undefined);
  const currentGuild = guildDetails?.info || null;

  const { getHeaders } = useCSRF();
  const [refreshButtonLoading, setRefreshButtonLoading] = useState(false);

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
      await fetchGuildDetails(guildId || "");
    } catch (err) {
      console.error("Failed to refresh guild data:", err);
    } finally {
      setRefreshButtonLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {isMainDashboard ? null : (
        <nav className="border-r-1 border-default-border h-full w-full max-w-xs">
          <div className="border-b-1 border-default-border h-18 flex items-center justify-between px-6 text-4xl">
            <a href="/dashboard" className="select-none text-primary-text">
              All Bot
            </a>
            <ActionButton
              size="md"
              onAction={handleRefresh}
              isLoading={refreshButtonLoading}
            />
          </div>

          <div className="p-4">
            {/* Guild Info */}
            {loading && !currentGuild ? (
              <GuildInfoSkeleton />
            ) : currentGuild ? (
              <div className="bg-default-component rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {currentGuild.icon ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.png`}
                        alt={currentGuild.name}
                        className="w-9 h-9 rounded-xl"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-text">
                        {currentGuild.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-primary-text text-lg font-semibold truncate">
                        {currentGuild.name}
                      </p>
                    </div>
                  </div>

                  {/* Back to Dashboard button */}
                  <button
                    className="flex items-center justify-center w-8 h-8 text-secondary-text hover:text-primary-text hover:bg-active-component transition-colors rounded-md cursor-pointer"
                    onClick={() => router.push("/dashboard")}
                    title="Back to Servers"
                  >
                    <IoArrowBack className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="space-y-1">
              {/* Home button */}
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-100 ${
                  !module
                    ? "bg-active-component text-primary-text"
                    : "text-secondary-text hover:text-primary-text hover:bg-hover-component"
                }`}
                onClick={() => router.push(`/dashboard/${guildId}`)}
              >
                <HiHome
                  className={`w-5 h-5 transition-colors duration-100 ${
                    !module
                      ? "text-primary-text"
                      : "text-secondary-text group-hover:text-primary-text"
                  }`}
                />
                <span className="text-sm">Home</span>
              </button>

              {/* Dynamic module buttons */}
              {(
                Object.keys(ALL_MODULE_CONFIGS) as Array<keyof ModuleSettings>
              ).map((moduleKey) => {
                const moduleConfig =
                  ALL_MODULE_CONFIGS[
                    moduleKey as keyof typeof ALL_MODULE_CONFIGS
                  ];
                const moduleSlug = moduleConfig.id;
                const isActive = module === moduleSlug;
                const IconComponent = moduleConfig.reactIconName
                  ? (HeroIcons as any)[moduleConfig.reactIconName]
                  : null;

                return (
                  <button
                    key={moduleKey}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-100 ${
                      isActive
                        ? "bg-active-component text-primary-text"
                        : "text-secondary-text hover:text-primary-text hover:bg-hover-component"
                    }`}
                    onClick={() =>
                      router.push(`/dashboard/${guildId}/${moduleSlug}`)
                    }
                  >
                    {IconComponent ? (
                      <IconComponent
                        className={`w-5 h-5 transition-colors duration-100 ${
                          isActive
                            ? "text-primary-text"
                            : "text-secondary-text group-hover:text-primary-text"
                        }`}
                      />
                    ) : (
                      <span className="text-xl">{moduleConfig.icon}</span>
                    )}
                    <span className="text-sm">{moduleConfig.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
      <div className="grow flex flex-col min-w-0">
        <div className="border-b-1 border-default-border h-18 flex items-center justify-between gap-7 p-6 flex-shrink-0">
          <div className="flex items-center">
            <Breadcrumb />
          </div>
          <UserDropdown />
        </div>
        <div className="p-8 flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
