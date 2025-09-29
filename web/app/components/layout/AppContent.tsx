"use client";

import { ReactNode } from "react";
import { Navbar } from "@/app/components/layout/Navbar";
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
      <Navbar />
      <main>{children}</main>
    </>
  );
}
