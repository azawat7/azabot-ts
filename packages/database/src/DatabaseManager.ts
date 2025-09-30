import mongoose from "mongoose";
import { UserRepository } from "./repositories/UserRepository";
import { GuildMemberRepository } from "./repositories/GuildMemberRepository";
import { GuildRepository } from "./repositories/GuildRepository";
import { SessionRepository } from "./repositories/SessionRepository";
import { logger } from "@shaw/utils";
import {
  ConnectionError,
  ConnectionTimeoutError,
  handleMongooseError,
} from "./utils/DatabaseErrors";
import { retryWithBackoff } from "./utils/RetryUtils";

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private static connectionPromise: Promise<void> | null = null;
  private static connectionLock = false;

  public guildMembers: GuildMemberRepository;
  public guilds: GuildRepository;
  public users: UserRepository;
  public sessions: SessionRepository;

  constructor() {
    this.guildMembers = new GuildMemberRepository();
    this.guilds = new GuildRepository();
    this.users = new UserRepository();
    this.sessions = new SessionRepository();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<void> {
    if (
      !DatabaseManager.connectionLock &&
      mongoose.connection.readyState === 1
    ) {
      logger.debug("Database already connected");
      return;
    }
    if (DatabaseManager.connectionPromise) {
      logger.debug("Database connection already in progress");
      return DatabaseManager.connectionPromise;
    }

    DatabaseManager.connectionPromise = this.doConnect();

    try {
      await DatabaseManager.connectionPromise;
    } finally {
      DatabaseManager.connectionPromise = null;
    }
  }

  private async doConnect(): Promise<void> {
    DatabaseManager.connectionLock = true;

    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      bufferCommands: false,
    };

    try {
      await retryWithBackoff(
        async () => {
          if (mongoose.connection.readyState === 1) {
            logger.info("MongoDB already connected");
            return;
          }

          if (mongoose.connection.readyState === 0) {
            await mongoose.connection.close();
          }

          await mongoose.connect(process.env.DB_MONGODB_URI!, options);
          logger.info("Successfully connected to MongoDB");
        },
        {
          maxAttempts: 5,
          initialDelayMs: 2000,
          maxDelayMs: 30000,
          backoffMultiplier: 2,
          shouldRetry: (error) => {
            const dbError = handleMongooseError(error);
            return (
              dbError instanceof ConnectionError ||
              dbError instanceof ConnectionTimeoutError
            );
          },
          onRetry: (attempt, error, delayMs) => {
            logger.warn(
              `MongoDB connection attempt ${attempt} failed. Retrying in ${delayMs}ms`,
              { error: error.message }
            );
          },
        }
      );
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error("MongoDB connection failed after all retries:", {
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    } finally {
      DatabaseManager.connectionLock = false;
    }
  }

  async disconnect(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
      logger.debug("Database not connected, skipping disconnect");
      return;
    }

    try {
      await mongoose.disconnect();
      logger.info("Disconnected from MongoDB");
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error("Error disconnecting from MongoDB:", {
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  isConnectionReady(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async ensureConnection(): Promise<void> {
    if (!this.isConnectionReady()) {
      await this.connect();
    }
  }

  getCacheStats() {
    return {
      guildMembers: this.guildMembers.getCacheStats(),
      guilds: this.guilds.getCacheStats(),
      users: this.users.getCacheStats(),
      sessions: this.sessions.getCacheStats(),
    };
  }

  cleanupAllCaches(): void {
    this.guildMembers.cleanupCache();
    this.guilds.cleanupCache();
    this.users.cleanupCache();
    this.sessions.cleanupCache();
    logger.info("Cleaned up all repository caches");
  }
}
