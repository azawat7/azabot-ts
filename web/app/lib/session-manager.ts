import { cookies } from "next/headers";
import { DiscordTokenResponse, SessionUser } from "./types";
import { signJWT, verifyJWT } from "./jwt";
import { DatabaseManager } from "@shaw/database";
import { randomBytes } from "crypto";
import { DiscordService } from "./discord-service";
import { logger } from "@shaw/utils";

const SESSION_COOKIE_NAME = "discord";
const SESSION_DURATION = 7 * 24 * 60 * 60;

export class SessionManager {
  private static db = new DatabaseManager();
  private static isConnected = false;

  private static async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.db.connect();
      this.db.startSessionCleanup();
      this.isConnected = true;
    }
  }

  static async createSession(
    user: SessionUser,
    tokenData: DiscordTokenResponse
  ): Promise<void> {
    await this.ensureConnection();
    const cookieStore = await cookies();
    const sessionId = randomBytes(32).toString("hex");
    const discordTokenExpiry = new Date(
      Date.now() + tokenData.expires_in * 1000
    );
    await this.db.sessions.createSession(
      sessionId,
      user.id,
      tokenData.access_token,
      tokenData.refresh_token,
      discordTokenExpiry
    );
    const jwt = await signJWT(user, sessionId);
    cookieStore.set(SESSION_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    });
  }

  static async getSession(): Promise<{
    user: SessionUser;
    discordAccessToken: string;
    sessionId: string;
  } | null> {
    await this.ensureConnection();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return null;
    }

    try {
      const payload = await verifyJWT(sessionCookie.value);
      if (!payload) {
        await this.clearSessionCookie();
        return null;
      }

      const session = await this.db.sessions.getActiveSession(
        payload.sessionId as string
      );
      if (!session) {
        await this.clearSessionCookie();
        return null;
      }

      if (DiscordService.isTokenExpired(session.discordTokenExpiry)) {
        const newTokenData = await DiscordService.refreshToken(
          session.discordRefreshToken
        );
        if (!newTokenData) {
          await this.db.sessions.deactivateSession(session.sessionId);
          await this.clearSessionCookie();
          return null;
        }

        const newExpiry = new Date(Date.now() + newTokenData.expires_in * 1000);
        const updatedSession = await this.db.sessions.updateDiscordTokens(
          session.sessionId,
          newTokenData.access_token,
          newTokenData.refresh_token,
          newExpiry
        );

        if (!updatedSession) {
          await this.db.sessions.deactivateSession(session.sessionId);
          await this.clearSessionCookie();
          return null;
        }

        const freshUserData = await DiscordService.getUser(
          newTokenData.access_token
        );
        if (freshUserData) {
          const updatedUser: SessionUser = {
            id: freshUserData.id,
            username: freshUserData.username,
            avatar: freshUserData.avatar,
          };

          const newJWT = await signJWT(updatedUser, session.sessionId);
          cookieStore.set(SESSION_COOKIE_NAME, newJWT, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_DURATION,
            path: "/",
          });

          return {
            user: updatedUser,
            discordAccessToken: newTokenData.access_token,
            sessionId: session.sessionId,
          };
        }

        return {
          user: payload.user,
          discordAccessToken: newTokenData.access_token,
          sessionId: session.sessionId,
        };
      }

      return {
        user: payload.user,
        discordAccessToken: session.discordAccessToken,
        sessionId: session.sessionId,
      };
    } catch (error) {
      logger.error("Error getting session:", error);
      await this.clearSession();
      return null;
    }
  }

  private static async clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  static async clearSession(): Promise<void> {
    await this.ensureConnection();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie) {
      try {
        const payload = await verifyJWT(sessionCookie.value);
        if (payload) {
          const session = await this.db.sessions.getActiveSession(
            payload.sessionId as string
          );
          if (session) {
            await DiscordService.revokeToken(session.discordAccessToken);
            await this.db.sessions.deactivateSession(session.sessionId);
          }
        }
      } catch (error) {
        logger.error("Error during session cleanup:", error);
      }
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  static async getValidDiscordToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.discordAccessToken || null;
  }

  static async makeDiscordAPICall(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response | null> {
    const discordToken = await this.getValidDiscordToken();
    if (!discordToken) {
      throw new Error("No valid Discord token available");
    }

    return DiscordService.makeAPICall(endpoint, discordToken, options);
  }
}
