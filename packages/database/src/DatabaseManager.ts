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
import { CONNECTION_OPTIONS, env } from "./config";
import { RedisCache } from "./cache/RedisCache";

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;

  public guildMembers: GuildMemberRepository;
  public guilds: GuildRepository;
  public users: UserRepository;
  public sessions: SessionRepository;
  public cache: RedisCache;

  constructor() {
    this.cache = new RedisCache();

    this.guildMembers = new GuildMemberRepository();
    this.guilds = new GuildRepository();
    this.users = new UserRepository();
    this.sessions = new SessionRepository();

    this.guildMembers.setCache(this.cache);
    this.guilds.setCache(this.cache);
    this.users.setCache(this.cache);
    this.sessions.setCache(this.cache);
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<void> {
    await Promise.all([this.connectMongoDB(), this.connectRedis()]);
  }

  private async connectMongoDB(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      logger.debug("MongoDB already connected");
      return;
    }

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

          await mongoose.connect(env.mongodbUri, CONNECTION_OPTIONS);
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
    }
  }

  async connectRedis(): Promise<void> {
    await this.cache.connect();
  }

  async disconnect(): Promise<void> {
    await Promise.all([this.disconnectMongoDB(), this.disconnectRedis()]);
  }

  async disconnectMongoDB(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
        logger.info("Disconnected from MongoDB");
      } catch (error) {
        const dbError = handleMongooseError(error);
        logger.error("Error disconnecting from MongoDB:", {
          error: dbError.message,
          code: dbError.code,
        });
      }
    }
  }

  async disconnectRedis(): Promise<void> {
    await this.cache.disconnect();
  }

  isMongoDBReady(): boolean {
    return mongoose.connection.readyState === 1;
  }

  isRedisReady(): boolean {
    return this.cache.isConnected();
  }

  isConnectionReady(): boolean {
    return this.isMongoDBReady() && this.isRedisReady();
  }

  async ensureConnection(): Promise<void> {
    const mongoReady = this.isMongoDBReady();
    const redisReady = this.isRedisReady();

    if (!mongoReady && !redisReady) {
      await this.connect();
    } else if (!mongoReady) {
      await this.connectMongoDB();
    } else if (!redisReady) {
      await this.connectRedis();
    }
  }

  async cleanupAllCaches(): Promise<void> {
    await Promise.all([
      this.guildMembers.clearCache(),
      this.guilds.clearCache(),
      this.users.clearCache(),
      this.sessions.clearCache(),
    ]);
    logger.info("Cleaned up all repository caches");
  }
}
