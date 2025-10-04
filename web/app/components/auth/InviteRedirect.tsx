"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InviteRedirect({ inviteUrl }: { inviteUrl: string }) {
  const router = useRouter();

  useEffect(() => {
    window.open(inviteUrl, "_blank");
    router.push("/");
  }, [inviteUrl, router]);

  return <>Redirecting</>;
}
