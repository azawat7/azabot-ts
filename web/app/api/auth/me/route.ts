import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/app/lib/session-manager";

export async function GET(request: NextRequest) {
  const session = await SessionManager.getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: session.user,
    sessionId: session.sessionId,
    hasValidDiscordToken: !!session.discordAccessToken,
  });
}
