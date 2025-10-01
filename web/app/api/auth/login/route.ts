import { NextRequest, NextResponse } from "next/server";
import { getDiscordAuthUrl } from "@/app/lib/discord";
import {
  env,
  STATE_COOKIE_DURATION,
  STATE_COOKIE_NAME,
} from "@/app/lib/config";

export async function GET(request: NextRequest) {
  const state =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  const discordAuthUrl = getDiscordAuthUrl(state);

  const response = NextResponse.redirect(discordAuthUrl);
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: STATE_COOKIE_DURATION,
    path: "/",
  });

  return response;
}
