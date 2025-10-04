"use client";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { ReactNode } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { LogoutButton } from "../components/auth/LogoutButton";
import { usePathname, useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import { HiHome } from "react-icons/hi2";
import { HiSparkles } from "react-icons/hi2";
import { useCurrentGuild } from "../contexts/GuildContext";
import { GuildInfoSkeleton } from "../components/ui/Skeleton";
import { Breadcrumb } from "../components/ui/Breadcrumb";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardContent>{children}</DashboardContent>
    </ProtectedRoute>
  );
}

function DashboardContent({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const { currentGuild, loading } = useCurrentGuild();
  const pathname = usePathname();
  const router = useRouter();

  const isMainDashboard = pathname === "/dashboard";
  const isGuildPage = pathname.match(/^\/dashboard\/[^\/]+$/);
  const isModulePage = pathname.match(/^\/dashboard\/[^\/]+\/[^\/]+$/);

  const guildId = isGuildPage || isModulePage ? pathname.split("/")[2] : null;
  const module = isModulePage ? pathname.split("/")[3] : null;

  return (
    <div className="flex h-screen">
      <nav className="border-r-1 border-zinc-700 h-full w-xs">
        <div className="border-b-1 border-zinc-700 h-22 mb-6 flex items-center justify-center text-4xl">
          <a href="/" className="select-none text-white">
            All Bot
          </a>
        </div>

        <div className="p-4">
          {isMainDashboard ? (
            <div className="text-center">
              <div className="text-white text-sm font-semibold mb-2">
                Choose a server
              </div>
              <div className="text-neutral-400 text-xs">
                Select a server from the main dashboard
              </div>
            </div>
          ) : (
            <>
              {/* Guild Info */}
              {loading && !currentGuild ? (
                <GuildInfoSkeleton />
              ) : currentGuild ? (
                <div className="bg-neutral-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {currentGuild.icon ? (
                        <img
                          src={`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.png`}
                          alt={currentGuild.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-bold text-white">
                          {currentGuild.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-semibold truncate">
                          {currentGuild.name}
                        </h3>
                        <p className="text-neutral-400 text-xs">
                          Current Server
                        </p>
                      </div>
                    </div>

                    {/* Back to Dashboard button */}
                    <button
                      className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors rounded-md cursor-pointer"
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
                      ? "bg-neutral-600 text-white"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-700"
                  }`}
                  onClick={() => router.push(`/dashboard/${guildId}`)}
                >
                  <HiHome
                    className={`w-5 h-5 transition-colors duration-100 ${
                      !module
                        ? "text-white"
                        : "text-neutral-400 group-hover:text-white"
                    }`}
                  />
                  <span className="text-sm font-medium">Home</span>
                </button>

                {/* Leveling module */}
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-100 ${
                    module === "leveling"
                      ? "bg-neutral-600 text-white"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-700"
                  }`}
                  onClick={() => router.push(`/dashboard/${guildId}/leveling`)}
                >
                  <HiSparkles
                    className={`w-5 h-5 transition-colors duration-100 ${
                      module === "leveling"
                        ? "text-white"
                        : "text-neutral-400 group-hover:text-white"
                    }`}
                  />
                  <span className="text-sm font-medium">Leveling</span>
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
      <div className="grow">
        <div className="border-b-1 border-zinc-700 h-22 flex items-center justify-between gap-7 p-6">
          <div className="flex items-center">
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-7">
            <LogoutButton />
            <div className="border-r-1 border-zinc-700 h-9"></div>
            {user ? (
              <>
                <span className="text-xl text-white">@{user.username}</span>
                <img
                  src={
                    user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : `https://cdn.discordapp.com/embed/avatars/${
                          parseInt(user.id) % 5
                        }.png`
                  }
                  alt={`${user.username}'s avatar`}
                  className="w-14 h-14 rounded-full select-none"
                />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
