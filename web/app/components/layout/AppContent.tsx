"use client";

import { ReactNode } from "react";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { Loading } from "@/app/components/layout/Loading";
import { usePathname } from "next/navigation";

interface AppContentProps {
  children: ReactNode;
}

export function AppContent({ children }: AppContentProps) {
  const { loading } = useAuthContext();
  const pathname = usePathname();

  if (loading && !pathname.startsWith("/dashboard")) {
    return <Loading />;
  }

  return <>{children}</>;
}
