import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";
import { withAuth } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async (req) => {
      return withAuth(req, async (_, user, discordAccessToken, sessionId) => {
        return NextResponse.json({
          user: user,
          sessionId: sessionId,
          hasValidDiscordToken: !!discordAccessToken,
        });
      });
    },
    { rateLimit: { tier: "relaxed" } }
  );
}
