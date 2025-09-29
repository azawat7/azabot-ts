import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/app/lib/auth";
import { logger } from "@shaw/utils";

export async function GET(request: NextRequest) {
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
}
