import {
  env,
  STATE_COOKIE_DURATION,
  STATE_COOKIE_NAME,
} from "@/app/lib/config";
import { getDiscordAuthUrl } from "@/app/lib/discord";
import { withRateLimit } from "@/app/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
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
    },
    { tier: "moderate" }
  );
}
