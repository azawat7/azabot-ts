import { Snowflake } from "discord.js";
import { Session } from "../models/Session";
import { ISession } from "@shaw/types";
import { BaseRepository } from "./BaseRepository";

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
    return await this.create({
      sessionId,
      userId,
      discordAccessToken,
      discordRefreshToken,
      discordTokenExpiry,
    });
  }

  async getSession(sessionId: string): Promise<ISession | null> {
    return await this.findOne({
      sessionId,
    });
  }

  async updateDiscordTokens(
    sessionId: string,
    newAccessToken: string,
    newRefreshToken: string,
    newExpiry: Date
  ): Promise<ISession | null> {
    return await this.updateOne(
      { sessionId },
      {
        discordAccessToken: newAccessToken,
        discordRefreshToken: newRefreshToken,
        discordTokenExpiry: newExpiry,
      }
    );
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return await this.deleteOne({ sessionId });
  }

  async deleteUserSessions(userId: Snowflake): Promise<void> {
    await this.model.deleteMany({ userId });
  }
}
