import { Snowflake } from "discord.js";
import { SessionData } from "@shaw/types";
import { CacheRepository } from "./CacheRepository";
import { REDIS_CACHE_TTL } from "../config";

export class SessionCache extends CacheRepository<SessionData> {
  constructor() {
    super("session:", REDIS_CACHE_TTL.Session);
  }

  protected getEntityKey(entity: Partial<SessionData>): string | null {
    if (entity.sessionId) return entity.sessionId;
    return null;
  }

  async createSession(
    sessionId: string,
    userId: Snowflake,
    discordAccessToken: string,
    discordRefreshToken: string,
    discordTokenExpiry: Date
  ): Promise<SessionData> {
    const session: SessionData = {
      sessionId,
      userId,
      discordAccessToken,
      discordRefreshToken,
      discordTokenExpiry,
    };

    await this.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return await this.get(sessionId);
  }

  async updateDiscordTokens(
    sessionId: string,
    newAccessToken: string,
    newRefreshToken: string,
    newExpiry: Date
  ): Promise<SessionData | null> {
    const session = await this.get(sessionId);
    if (!session) return null;

    const updatedSession: SessionData = {
      ...session,
      discordAccessToken: newAccessToken,
      discordRefreshToken: newRefreshToken,
      discordTokenExpiry: newExpiry,
    };

    await this.set(sessionId, updatedSession);
    return updatedSession;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const exists = await this.exists(sessionId);
    if (exists) {
      await this.delete(sessionId);
      return true;
    }
    return false;
  }
}
