import { cookies } from "next/headers";
import { DiscordTokenResponse, SessionUser } from "../types";
import { signJWT, verifyJWT } from "./";
import { DatabaseManager } from "@shaw/database";
import { randomBytes } from "crypto";
import { DiscordService } from "../discord";
import { logger } from "@shaw/utils";
import { env, SESSION_COOKIE_NAME, SESSION_DURATION } from "@/app/lib/config";

export class SessionManager {
  private static db = DatabaseManager.getInstance();

  static async createSession(
    user: SessionUser,
    tokenData: DiscordTokenResponse
  ): Promise<void> {
    await this.db.ensureConnection();
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
      secure: env.nodeEnv === "production",
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
    await this.db.ensureConnection();
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

      const session = await this.db.sessions.getSession(
        payload.sessionId as string
      );
      if (!session) {
        await this.clearSessionCookie();
        return null;
      }

      if (DiscordService.isTokenExpired(session.discordTokenExpiry)) {
        return await this.refreshSession(session, payload.user, cookieStore);
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

  private static async refreshSession(
    session: any,
    user: any,
    cookieStore: any
  ) {
    try {
      const newTokenData = await DiscordService.refreshToken(
        session.discordRefreshToken
      );
      if (!newTokenData) {
        await this.db.sessions.deleteSession(session.sessionId);
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
        await this.db.sessions.deleteSession(session.sessionId);
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
          secure: env.nodeEnv === "production",
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
        user,
        discordAccessToken: newTokenData.access_token,
        sessionId: session.sessionId,
      };
    } catch (error) {
      logger.error("Error refreshing session:", error);
      await this.clearSession();
      return null;
    }
  }

  private static async clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  static async clearSession(): Promise<void> {
    await this.db.ensureConnection();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie) {
      try {
        const payload = await verifyJWT(sessionCookie.value);
        if (payload) {
          const session = await this.db.sessions.getSession(
            payload.sessionId as string
          );
          if (session) {
            await DiscordService.revokeToken(session.discordAccessToken);
            await this.db.sessions.deleteSession(session.sessionId);
          }
        }
      } catch (error) {
        logger.error("Error during session cleanup:", error);
      }
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  static async cleanupExpiredSessions(): Promise<void> {
    await this.db.ensureConnection();

    try {
      const expiredDate = new Date(Date.now() - SESSION_DURATION * 1000);
      const result = await this.db.sessions.cleanupExpiredSessions(expiredDate);

      if (result > 0) {
        logger.info(`Cleaned up ${result} expired sessions`);
      }
    } catch (error) {
      logger.error("Error cleaning up expired sessions:", error);
    }
  }
}
