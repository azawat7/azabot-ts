import mongoose from "mongoose";
import { UserRepository } from "./repositories/UserRepository";
import { GuildMemberRepository } from "./repositories/GuildMemberRepository";
import { GuildRepository } from "./repositories/GuildRepository";
import { SessionRepository } from "./repositories/SessionRepository";
import { logger } from "@shaw/utils";

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private static isConnecting: boolean = false;
  private static isConnected: boolean = false;

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
    if (DatabaseManager.isConnected) {
      logger.debug("Database already connected");
      return;
    }
    if (DatabaseManager.isConnecting) {
      logger.debug("Database connection already in progress");
      await this.waitForConnection();
      return;
    }

    DatabaseManager.isConnecting = true;

    try {
      if (mongoose.connection.readyState === 1) {
        logger.info("MongoDB already connected via mongoose");
        DatabaseManager.isConnected = true;
        DatabaseManager.isConnecting = false;
        return;
      }

      const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
        bufferCommands: false,
      };

      await mongoose.connect(process.env.DB_MONGODB_URI!, options);

      DatabaseManager.isConnected = true;
      logger.info("Connected to MongoDB");
    } catch (error) {
      logger.error("MongoDB connection failed:", error);
      DatabaseManager.isConnected = false;
      throw error;
    } finally {
      DatabaseManager.isConnecting = false;
    }
  }

  private async waitForConnection(maxWait: number = 10000): Promise<void> {
    const startTime = Date.now();
    while (DatabaseManager.isConnecting && Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!DatabaseManager.isConnected) {
      throw new Error("Database connection timeout");
    }
  }

  async disconnect(): Promise<void> {
    if (!DatabaseManager.isConnected) {
      logger.debug("Database not connected, skipping disconnect");
      return;
    }

    try {
      await mongoose.disconnect();
      DatabaseManager.isConnected = false;
      logger.info("Disconnected from MongoDB");
    } catch (error) {
      logger.error("Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  isConnectionReady(): boolean {
    return DatabaseManager.isConnected && mongoose.connection.readyState === 1;
  }

  async ensureConnection(): Promise<void> {
    if (!this.isConnectionReady()) {
      await this.connect();
    }
  }
}
