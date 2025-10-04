"use client";

import { ReactNode } from "react";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { Loading } from "@/app/components/layout/Loading";
import { usePathname } from "next/navigation";
import { DashboardSkeleton } from "@/app/components/ui/Skeleton";

interface AppContentProps {
  children: ReactNode;
}

export function AppContent({ children }: AppContentProps) {
  const { loading } = useAuthContext();
  const pathname = usePathname();

  if (loading) {
    if (pathname.startsWith("/dashboard")) {
      return <DashboardSkeleton />;
    }
    return <Loading />;
  }

  return (
    <>
      <main>{children}</main>
    </>
  );
}
