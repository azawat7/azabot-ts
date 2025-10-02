import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "./";
import { SessionUser } from "../types";
import { logger } from "@shaw/utils";

type AuthHandler = (
  request: NextRequest,
  user: SessionUser,
  discordAccessToken: string,
  sessionId: string
) => Promise<NextResponse>;

export async function withAuth(
  request: NextRequest,
  handler: AuthHandler
): Promise<NextResponse> {
  try {
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
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function withRecentAuth(
  request: NextRequest,
  handler: AuthHandler
): Promise<NextResponse> {
  return withAuth(request, async (req, user, discordToken, sessionId) => {
    const sessionCookie = req.cookies.get("discord");
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Session cookie not found" },
        { status: 401 }
      );
    }

    try {
      const { verifyJWT } = await import("./jwt.service");
      const payload = await verifyJWT(sessionCookie.value);

      if (!payload) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Invalid session" },
          { status: 401 }
        );
      }

      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      if (payload.iat! < oneHourAgo) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Recent authentication required",
            requiresReauth: true,
          },
          { status: 403 }
        );
      }

      return handler(req, user, discordToken, sessionId);
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Session verification failed" },
        { status: 401 }
      );
    }
  });
}
