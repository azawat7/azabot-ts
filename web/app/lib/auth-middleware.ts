import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "./session-manager";
import { SessionUser } from "./types";

export async function withAuth(
  request: NextRequest,
  handler: (
    request: NextRequest,
    user: SessionUser,
    discordToken: string,
    sessionId: string
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await SessionManager.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", message: "No valid session found" },
      { status: 401 }
    );
  }

  return handler(
    request,
    session.user,
    session.discordAccessToken,
    session.sessionId
  );
}

export async function withRecentAuth(
  request: NextRequest,
  handler: (
    request: NextRequest,
    user: SessionUser,
    discordToken: string,
    sessionId: string
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user, discordToken, sessionId) => {
    const sessionCookie = req.cookies.get("discord");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { verifyJWT } = await import("./jwt");
      const payload = await verifyJWT(sessionCookie.value);

      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      if (payload.iat! < oneHourAgo) {
        return NextResponse.json(
          { error: "Forbidden", message: "Recent authentication required" },
          { status: 403 }
        );
      }

      return handler(req, user, discordToken, sessionId);
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  });
}
