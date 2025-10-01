import { NextRequest, NextResponse } from "next/server";
import { logger } from "@shaw/utils";
import { withSecurity } from "@/app/lib/security";
import { SessionManager, withAuth } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async (req) => {
      return withAuth(req, async () => {
        try {
          const session = await SessionManager.getSession();

          if (!session) {
            return NextResponse.json({ user: null }, { status: 401 });
          }

          return NextResponse.json({
            user: session.user,
            sessionId: session.sessionId,
            hasValidDiscordToken: !!session.discordAccessToken,
          });
        } catch (error) {
          logger.error("Error getting user session:", error);
          return NextResponse.json({ user: null }, { status: 401 });
        }
      });
    },
    { rateLimit: { tier: "relaxed" } }
  );
}
