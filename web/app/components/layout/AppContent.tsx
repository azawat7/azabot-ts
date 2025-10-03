"use client";

import { ReactNode } from "react";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { Loading } from "@/app/components/layout/Loading";

interface AppContentProps {
  children: ReactNode;
}

export function AppContent({ children }: AppContentProps) {
  const { loading } = useAuthContext();

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <main>{children}</main>
    </>
  );
}
