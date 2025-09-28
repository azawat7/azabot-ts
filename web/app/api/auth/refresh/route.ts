import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/app/lib/session-manager";

export async function POST(request: NextRequest) {
  const session = await SessionManager.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "No valid session or unable to refresh" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: session.user,
    hasValidDiscordToken: !!session.discordAccessToken,
  });
}
