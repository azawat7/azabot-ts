import mongoose from "mongoose";
import { UserRepository } from "./repositories/UserRepository";
import { GuildMemberRepository } from "./repositories/GuildMemberRepository";
import { GuildRepository } from "./repositories/GuildRepository";
import { SessionRepository } from "./repositories/SessionRepository";
import { logger } from "@shaw/utils";

export class DatabaseManager {
  public guildMembers: GuildMemberRepository;
  public guilds: GuildRepository;
  public users: UserRepository;
  public sessions: SessionRepository;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.guildMembers = new GuildMemberRepository();
    this.guilds = new GuildRepository();
    this.users = new UserRepository();
    this.sessions = new SessionRepository();
  }

  async connect(): Promise<void> {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
        bufferCommands: false,
      };
      await mongoose.connect(process.env.DB_MONGODB_URI!, options);
      logger.info("Connected to MongoDB");
    } catch (error) {
      logger.error("MongoDB connection failed:", error);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }

  startSessionCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.sessions.cleanupExpiredSessions();
      } catch (error) {
        logger.error("Session cleanup failed:", error);
      }
    }, 60 * 60 * 1000);
  }
}
