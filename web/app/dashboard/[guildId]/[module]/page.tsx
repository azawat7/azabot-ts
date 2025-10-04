"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ModuleSettings } from "@shaw/types";

export default function GuildDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  return <>test</>;
}
