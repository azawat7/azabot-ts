import { Document, Model } from "mongoose";
import { CacheManager, CacheOptions } from "db/utils/CacheManager";
import { logger } from "@/utils/Logger";

export abstract class BaseRepository<T extends Document> {
  protected cache: CacheManager<T>;
  constructor(protected model: Model<T>, cacheOptions: CacheOptions) {
    this.cache = new CacheManager<T>(cacheOptions);
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const result = await this.model.create(data);
      const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
      this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      logger.error("DB create:", e);
      throw e;
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey({ _id: id } as Partial<T>);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
      const result = await this.model.findById(id);
      if (result) this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      logger.error("DB findById:", e);
      throw e;
    }
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(filter);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
      const result = await this.model.findOne(filter as any);
      if (result) this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      logger.error("DB findOne:", e);
      throw e;
    }
  }

  async find(filter: Partial<T> = {}, limit?: number): Promise<T[]> {
    try {
      const cacheKey = this.getCacheKey(filter, limit);
      const cached = this.cache.get(cacheKey);
      if (cached) return Array.isArray(cached) ? cached : [cached];
      const query = this.model.find(filter as any);
      if (limit) query.limit(limit);
      const results = await query;
      this.cache.set(cacheKey, results as any);
      return results;
    } catch (e) {
      logger.error("DB find:", e);
      throw e;
    }
  }

  async updateOne(filter: Partial<T>, update: Partial<T>): Promise<T | null> {
    try {
      const result = await this.model.findOneAndUpdate(
        filter as any,
        update as any,
        {
          new: true,
          upsert: false,
        }
      );
      if (result) {
        const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
        this.cache.set(cacheKey, result);
        this.invalidateRelatedCache(filter);
      }
      return result;
    } catch (e) {
      logger.error("DB updateOne:", e);
      throw e;
    }
  }

  async upsert(filter: Partial<T>, update: Partial<T>): Promise<T> {
    try {
      const result = await this.model.findOneAndUpdate(
        filter as any,
        update as any,
        {
          new: true,
          upsert: true,
        }
      );
      const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
      this.cache.set(cacheKey, result);
      this.invalidateRelatedCache(filter);
      return result;
    } catch (e) {
      logger.error("DB upsert:", e);
      throw e;
    }
  }

  async deleteOne(filter: Partial<T>): Promise<boolean> {
    try {
      const result = await this.model.deleteOne(filter as any);
      if (result.deletedCount > 0) this.invalidateRelatedCache(filter);
      return result.deletedCount > 0;
    } catch (e) {
      logger.error("DB deleteOne:", e);
      throw e;
    }
  }

  async count(filter: Partial<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments(filter as any);
    } catch (e) {
      logger.error("DB count:", e);
      throw e;
    }
  }

  protected getCacheKey(filter: Partial<T>, limit?: number): string {
    const filterStr = JSON.stringify(filter, Object.keys(filter).sort());
    return limit ? `${filterStr}:limit:${limit}` : filterStr;
  }

  protected invalidateRelatedCache(filter: Partial<T>): void {
    const filterKeys = Object.keys(filter);
    for (const [cacheKey] of (this.cache as any).cache) {
      try {
        const parsedKey = JSON.parse(cacheKey.split(":limit:")[0]);
        const keyFields = Object.keys(parsedKey);

        if (filterKeys.some((key) => keyFields.includes(key))) {
          this.cache.delete(cacheKey);
        }
      } catch (e) {
        logger.error("Failed to parse cache key for invalidation :", e);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
    logger.debug(`Cleared all cache for ${this.model.modelName}`);
  }

  cleanupCache(): void {
    this.cache.cleanup();
    logger.debug(
      `Cleaned up expired cache entries for ${this.model.modelName}`
    );
  }
}
