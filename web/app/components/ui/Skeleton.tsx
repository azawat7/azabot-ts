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
