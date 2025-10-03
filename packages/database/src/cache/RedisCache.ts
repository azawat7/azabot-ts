import { createClient, RedisArgument, RedisClientType } from "redis";
import { logger } from "@shaw/utils";
import { BATCH_SIZE, env } from "../config";

export class RedisCache {
  private client: RedisClientType | null = null;

  constructor() {}

  async connect(): Promise<void> {
    if (this.client?.isReady) {
      return;
    }

    try {
      this.client = createClient({
        url: env.redisUrl,
      });

      this.client.on("error", (err) => {
        logger.error("Redis Client Error:", err);
      });

      this.client.on("ready", () => {
        logger.info("Redis client is ready");
      });

      this.client.on("reconnecting", () => {
        logger.warn("Redis client is reconnecting...");
      });

      this.client.on("end", () => {
        logger.warn("Redis connection closed");
      });

      await this.client.connect();
      logger.info("Successfully connected to Redis");
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
      logger.info("Disconnected from Redis");
    }
    this.client = null;
  }

  isConnected(): boolean {
    return this.client?.isReady ?? false;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected() || !this.client) {
      logger.warn("Redis not connected, skipping cache set");
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected() || !this.client) {
      logger.warn("Redis not connected, skipping cache get");
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected() || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.isConnected() || !this.client) {
      return 0;
    }

    try {
      let cursor: RedisArgument = "0";
      let deletedCount = 0;
      const batchSize = BATCH_SIZE;

      do {
        const result = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: batchSize,
        });

        cursor = result.cursor;
        const keys = result.keys;

        if (keys.length > 0) {
          await this.client.del(keys);
          deletedCount += keys.length;
        }
      } while (cursor !== "0");

      if (deletedCount > 0) {
        logger.debug(
          `Deleted ${deletedCount} keys matching pattern: ${pattern}`
        );
      }

      return deletedCount;
    } catch (error) {
      logger.error(`Redis delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected() || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected() || !this.client) {
      return;
    }

    try {
      await this.client.flushDb();
      logger.info("Redis cache cleared");
    } catch (error) {
      logger.error("Redis clear error:", error);
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    dbSize: number;
  }> {
    if (!this.isConnected() || !this.client) {
      return { connected: false, dbSize: 0 };
    }

    try {
      const dbSize = await this.client.dbSize();
      return {
        connected: true,
        dbSize,
      };
    } catch (error) {
      logger.error("Redis stats error:", error);
      return { connected: false, dbSize: 0 };
    }
  }

  async setHash(key: string, field: string, value: any): Promise<void> {
    if (!this.isConnected() || !this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.hSet(key, field, serialized);
    } catch (error) {
      logger.error(`Redis hash set error for ${key}:${field}:`, error);
    }
  }

  async getHash<T>(key: string, field: string): Promise<T | null> {
    if (!this.isConnected() || !this.client) {
      return null;
    }

    try {
      const value = await this.client.hGet(key, field);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Redis hash get error for ${key}:${field}:`, error);
      return null;
    }
  }

  async getAllHash<T>(key: string): Promise<Record<string, T>> {
    if (!this.isConnected() || !this.client) {
      return {};
    }

    try {
      const values = await this.client.hGetAll(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(values)) {
        result[field] = JSON.parse(value) as T;
      }

      return result;
    } catch (error) {
      logger.error(`Redis hash getAll error for ${key}:`, error);
      return {};
    }
  }

  async delHash(key: string, field: string): Promise<void> {
    if (!this.isConnected() || !this.client) {
      return;
    }

    try {
      await this.client.hDel(key, field);
    } catch (error) {
      logger.error(`Redis hash delete error for ${key}:${field}:`, error);
    }
  }

  async increment(key: string): Promise<number> {
    if (!this.isConnected() || !this.client) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Redis increment error for key ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConnected() || !this.client) {
      return false;
    }

    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error(`Redis expire error for key ${key}:`, error);
      return false;
    }
  }
}
