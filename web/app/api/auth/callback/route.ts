import { NextRequest, NextResponse } from "next/server";
import { DISCORD_CONFIG, DiscordService } from "@/app/lib/discord";
import { SessionManager } from "@/app/lib/auth";
import { SessionUser } from "@/app/lib/types";
import { logger } from "@shaw/utils";

enum AuthError {
  ACCESS_DENIED = "access_denied",
  NO_CODE = "no_code",
  INVALID_STATE = "invalid_state",
  TOKEN_EXCHANGE_FAILED = "token_exchange_failed",
  USER_FETCH_FAILED = "user_fetch_failed",
  SESSION_CREATION_FAILED = "session_creation_failed",
}

function redirectWithError(
  request: NextRequest,
  error: AuthError,
  message?: string
): NextResponse {
  const url = new URL("/", request.url);
  url.searchParams.set("error", error);
  if (message) {
    url.searchParams.set("message", message);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    logger.warn(`OAuth error from Discord: ${error}`);
    return redirectWithError(request, AuthError.ACCESS_DENIED);
  }

  if (!code) {
    logger.warn("No authorization code received");
    return redirectWithError(request, AuthError.NO_CODE);
  }
  const storedState = request.cookies.get("state")?.value;
  if (!storedState || storedState !== state) {
    logger.warn("State mismatch - possible CSRF attempt");
    return redirectWithError(request, AuthError.INVALID_STATE);
  }

  try {
    const tokenData = await DiscordService.exchangeCode(
      code,
      DISCORD_CONFIG.redirectUri
    );

    if (!tokenData) {
      logger.error("Failed to exchange authorization code for tokens");
      return redirectWithError(request, AuthError.TOKEN_EXCHANGE_FAILED);
    }

    const userData = await DiscordService.getUser(tokenData.access_token);

    if (!userData) {
      logger.error("Failed to fetch user data from Discord");
      return redirectWithError(request, AuthError.USER_FETCH_FAILED);
    }

    const sessionUser: SessionUser = {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
    };

    await SessionManager.createSession(sessionUser, tokenData);

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("state");

    logger.info(
      `User ${userData.username} (${userData.id}) authenticated successfully`
    );

    return response;
  } catch (error) {
    logger.error("Unexpected error during OAuth callback:", error);
    return redirectWithError(
      request,
      AuthError.SESSION_CREATION_FAILED,
      "An unexpected error occurred"
    );
  }
}
