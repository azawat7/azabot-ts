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
