import { NextRequest, NextResponse } from "next/server";
import { DISCORD_CONFIG } from "@/app/lib/discord";
import { SessionManager } from "@/app/lib/session-manager";
import {
  DiscordTokenResponse,
  DiscordUser,
  SessionUser,
} from "@/app/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?error=access_denied", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  const storedState = request.cookies.get("state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }

  try {
    const tokenResponse = await fetch(DISCORD_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: DISCORD_CONFIG.clientId,
        client_secret: DISCORD_CONFIG.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_CONFIG.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData: DiscordTokenResponse = await tokenResponse.json();

    const userResponse = await fetch(DISCORD_CONFIG.userUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData: DiscordUser = await userResponse.json();

    const sessionUser: SessionUser = {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
    };

    await SessionManager.createSession(sessionUser, tokenData);

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("oauth_state");

    return response;
  } catch (error) {
    console.error("Discord OAuth error:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}
