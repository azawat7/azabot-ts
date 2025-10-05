"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-zinc-800 rounded
        ${className}
      `}
    />
  );
}

export function GuildCardSkeleton() {
  return (
    <div className="animate-pulse bg-zinc-800 hover:bg-zinc-700 rounded-lg p-6 transition-colors border border-zinc-700">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-zinc-700" />
        <div className="flex-1 min-w-0">
          <div className="h-6 w-32 mb-2 bg-zinc-700 rounded" />
          <div className="h-4 w-24 bg-zinc-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <nav className="border-r-1 border-zinc-700 h-full w-xs">
        <div className="border-b-1 border-zinc-700 h-22 mb-6 flex items-center justify-center">
          <div className="animate-pulse bg-zinc-800 h-8 w-32 rounded"></div>
        </div>

        <div className="p-4">
          <GuildInfoSkeleton />

          {/* Navigation skeleton */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="animate-pulse bg-zinc-800 w-5 h-5 rounded"></div>
              <div className="animate-pulse bg-zinc-800 h-4 w-16 rounded"></div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="animate-pulse bg-zinc-800 w-5 h-5 rounded"></div>
              <div className="animate-pulse bg-zinc-800 h-4 w-18 rounded"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="grow">
        {/* Top header skeleton */}
        <div className="border-b-1 border-zinc-700 h-22 flex items-center justify-between gap-7 p-6">
          {/* Breadcrumb skeleton on the left */}
          <BreadcrumbSkeleton />
          {/* Right side elements */}
          <div className="flex items-center gap-7">
            <div className="animate-pulse bg-zinc-800 h-8 w-16 rounded"></div>
            <div className="border-r-1 border-zinc-700 h-full"></div>
            <div className="animate-pulse bg-zinc-800 h-6 w-24 rounded"></div>
            <div className="animate-pulse bg-zinc-800 w-14 h-14 rounded-full"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="p-8">
          <div className="animate-pulse bg-zinc-800 h-10 w-48 rounded mb-6"></div>
          <div className="px-8 py-8 rounded-2xl border-1 border-zinc-700">
            <div>
              <div className="flex justify-between items-center gap-4 mb-6">
                <div className="animate-pulse bg-zinc-800 h-6 w-80 rounded"></div>
                <div className="animate-pulse bg-zinc-800 w-10 h-10 rounded-xl"></div>
              </div>
            </div>
            <div className="border-b-1 my-6 border-zinc-700"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <GuildCardSkeleton />
              <GuildCardSkeleton />
              <GuildCardSkeleton />
              <GuildCardSkeleton />
              <GuildCardSkeleton />
              <GuildCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GuildInfoSkeleton() {
  return (
    <div className="animate-pulse bg-zinc-800 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="animate-pulse bg-zinc-700 w-10 h-10 rounded-full"></div>
          <div className="flex-1">
            <div className="animate-pulse bg-zinc-700 h-4 w-24 rounded mb-2"></div>
            <div className="animate-pulse bg-zinc-700 h-3 w-20 rounded"></div>
          </div>
        </div>
        <div className="flex items-center justify-center w-8 h-8">
          <div className="animate-pulse bg-zinc-700 w-5 h-5 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center space-x-1 text-sm">
      <div className="animate-pulse bg-zinc-800 h-4 w-20 rounded" />

      <div className="animate-pulse bg-zinc-800 w-4 h-4 rounded mx-2" />

      <div className="animate-pulse bg-zinc-800 h-4 w-24 rounded" />

      <div className="animate-pulse bg-zinc-800 w-4 h-4 rounded mx-2" />

      <div className="animate-pulse bg-zinc-800 h-4 w-16 rounded" />
    </div>
  );
}

export function GuildDashboardSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6 select-none flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-10 bg-zinc-700 rounded w-64"></div>
          <div className="h-8 bg-zinc-800 rounded w-48"></div>
        </div>
      </div>

      {/* Guild Information Skeleton */}
      <div className="px-8 py-6 rounded-2xl border-1 border-zinc-700 bg-zinc-900/50 mb-6 select-none flex-shrink-0">
        <div className="h-8 bg-zinc-700 rounded w-48 mb-4"></div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-7">
            <div className="w-16 h-16 rounded-full bg-zinc-700"></div>
            <div>
              <div className="h-4 bg-zinc-700 rounded w-24 mb-2"></div>
              <div className="h-6 bg-zinc-700 rounded w-32"></div>
            </div>
          </div>
          <div className="h-12 w-px bg-zinc-700" />
          <div>
            <div className="h-4 bg-zinc-700 rounded w-20 mb-2"></div>
            <div className="h-6 bg-zinc-700 rounded w-40"></div>
          </div>
          <div className="h-12 w-px bg-zinc-700" />
          <div>
            <div className="h-4 bg-zinc-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-zinc-700 rounded w-28"></div>
          </div>
        </div>
      </div>

      {/* Modules and Commands Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Modules Skeleton */}
        <div className="px-8 py-6 rounded-2xl border-1 border-zinc-700 bg-zinc-900/50 select-none flex flex-col min-h-0">
          <div className="h-8 bg-zinc-700 rounded w-32 mb-4 flex-shrink-0"></div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-zinc-700"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-zinc-700 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-zinc-700 rounded w-48"></div>
                  </div>
                </div>
                <div className="w-11 h-6 bg-zinc-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Commands Skeleton */}
        <div className="px-8 py-6 rounded-2xl border-1 border-zinc-700 bg-zinc-900/50 select-none flex flex-col min-h-0">
          <div className="h-8 bg-zinc-700 rounded w-36 mb-4 flex-shrink-0"></div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-zinc-700"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-zinc-700 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-zinc-700 rounded w-40"></div>
                  </div>
                </div>
                <div className="w-11 h-6 bg-zinc-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
