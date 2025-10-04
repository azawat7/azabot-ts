import {
  env,
  STATE_COOKIE_DURATION,
  STATE_COOKIE_NAME,
} from "@/app/lib/config";
import { getDiscordAuthUrl } from "@/app/lib/discord";
import { withRateLimit } from "@/app/lib/security";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      const state = randomBytes(32).toString("base64url");

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
