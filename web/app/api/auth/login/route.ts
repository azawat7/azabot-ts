import { NextRequest, NextResponse } from "next/server";
import { getDiscordAuthUrl } from "@/app/lib/discord";

export async function GET(request: NextRequest) {
  const state =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  const discordAuthUrl = getDiscordAuthUrl(state);

  const response = NextResponse.redirect(discordAuthUrl);
  response.cookies.set("state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return response;
}
