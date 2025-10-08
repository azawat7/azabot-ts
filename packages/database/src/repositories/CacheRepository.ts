import { logger } from "@shaw/utils";
import { RedisCache } from "../cache/RedisCache";
import { TTL_JITTER } from "../config";

export abstract class CacheRepository<T> {
  protected cache: RedisCache | null = null;
  protected cacheTTL: number;
  protected cachePrefix: string;

  constructor(cachePrefix: string, cacheTTL: number = 300) {
    this.cachePrefix = cachePrefix;
    this.cacheTTL = cacheTTL;
  }

  setCache(cache: RedisCache): void {
    this.cache = cache;
  }

  protected getCacheKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }

  protected getRandomizedTTL(): number {
    const jitter = this.cacheTTL * TTL_JITTER * (Math.random() * 2 - 1);
    return Math.floor(this.cacheTTL + jitter);
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.cache) {
      logger.warn("Cache not initialized, skipping set operation");
      return;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      const finalTTL = ttl ?? this.getRandomizedTTL();
      await this.cache.set(cacheKey, value, finalTTL);
    } catch (error) {
      logger.error(`Cache set failed for ${this.cachePrefix}${key}:`, error);
    }
  }

  async get(key: string): Promise<T | null> {
    if (!this.cache) {
      logger.warn("Cache not initialized, skipping get operation");
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      return await this.cache.get<T>(cacheKey);
    } catch (error) {
      logger.error(`Cache get failed for ${this.cachePrefix}${key}:`, error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.cache) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      await this.cache.delete(cacheKey);
    } catch (error) {
      logger.error(`Cache delete failed for ${this.cachePrefix}${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.cache) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      return await this.cache.exists(cacheKey);
    } catch (error) {
      logger.error(
        `Cache exists check failed for ${this.cachePrefix}${key}:`,
        error
      );
      return false;
    }
  }

  async increment(key: string): Promise<number> {
    if (!this.cache) {
      logger.warn("Cache not initialized, skipping increment operation");
      return 0;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      return await this.cache.increment(cacheKey);
    } catch (error) {
      logger.error(
        `Cache increment failed for ${this.cachePrefix}${key}:`,
        error
      );
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.cache) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      return await this.cache.expire(cacheKey, seconds);
    } catch (error) {
      logger.error(`Cache expire failed for ${this.cachePrefix}${key}:`, error);
      return false;
    }
  }

  async setHash(key: string, field: string, value: any): Promise<void> {
    if (!this.cache) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      await this.cache.setHash(cacheKey, field, value);
    } catch (error) {
      logger.error(
        `Cache hash set failed for ${this.cachePrefix}${key}:${field}:`,
        error
      );
    }
  }

  async getHash<V = T>(key: string, field: string): Promise<V | null> {
    if (!this.cache) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      return await this.cache.getHash<V>(cacheKey, field);
    } catch (error) {
      logger.error(
        `Cache hash get failed for ${this.cachePrefix}${key}:${field}:`,
        error
      );
      return null;
    }
  }

  async getAllHash<V = T>(key: string): Promise<Record<string, V>> {
    if (!this.cache) {
      return {};
    }

    try {
      const cacheKey = this.getCacheKey(key);
      return await this.cache.getAllHash<V>(cacheKey);
    } catch (error) {
      logger.error(
        `Cache hash getAll failed for ${this.cachePrefix}${key}:`,
        error
      );
      return {};
    }
  }

  async delHash(key: string, field: string): Promise<void> {
    if (!this.cache) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      await this.cache.delHash(cacheKey, field);
    } catch (error) {
      logger.error(
        `Cache hash delete failed for ${this.cachePrefix}${key}:${field}:`,
        error
      );
    }
  }

  async clearAll(): Promise<void> {
    if (!this.cache) {
      return;
    }

    try {
      const pattern = `${this.cachePrefix}*`;
      const deletedCount = await this.cache.deleteByPattern(pattern);

      if (deletedCount > 0) {
        logger.debug(
          `Cleared ${deletedCount} cache entries for ${this.cachePrefix}`
        );
      }
    } catch (error) {
      logger.error(`Failed to clear cache for ${this.cachePrefix}:`, error);
    }
  }
}
