import { Snowflake } from "discord.js";
import { Session } from "../models/Session";
import { ISession } from "@shaw/types";
import { BaseRepository } from "./BaseRepository";
import { logger } from "@shaw/utils";

export class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session, {
      ttl: 5 * 60 * 1000,
      maxSize: 1000,
    });
  }

  async createSession(
    sessionId: string,
    userId: Snowflake,
    discordAccessToken: string,
    discordRefreshToken: string,
    discordTokenExpiry: Date
  ): Promise<ISession> {
    await this.model.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    return await this.create({
      sessionId,
      userId,
      discordAccessToken,
      discordRefreshToken,
      discordTokenExpiry,
      isActive: true,
    });
  }

  async getActiveSession(sessionId: string): Promise<ISession | null> {
    return await this.findOne({
      sessionId,
      isActive: true,
    });
  }

  async updateDiscordTokens(
    sessionId: string,
    newAccessToken: string,
    newRefreshToken: string,
    newExpiry: Date
  ): Promise<ISession | null> {
    return await this.updateOne(
      { sessionId, isActive: true },
      {
        discordAccessToken: newAccessToken,
        discordRefreshToken: newRefreshToken,
        discordTokenExpiry: newExpiry,
      }
    );
  }

  async deactivateSession(sessionId: string): Promise<boolean> {
    const result = await this.updateOne({ sessionId }, { isActive: false });
    return !!result;
  }

  async deactivateUserSessions(userId: Snowflake): Promise<void> {
    await this.model.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await this.model.deleteMany({
        $or: [
          { isActive: false },
          { discordTokenExpiry: { $lt: new Date() } },
          {
            createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        ],
      });

      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} expired sessions`);
      }
    } catch (error) {
      logger.error("Failed to cleanup expired sessions:", error);
    }
  }
}
