import { Document, Model } from "mongoose";
import { logger } from "@shaw/utils";
import { handleMongooseError, isRetryableError } from "../utils/DatabaseErrors";
import { retryWithBackoff } from "../utils/RetryUtils";
import { REDIS_CACHE_TTL, RepositoryName } from "../config";
import { RedisCache } from "../cache/RedisCache";

export abstract class BaseRepository<T extends Document> {
  protected cache: RedisCache | null = null;
  protected cacheTTL: number;
  protected cachePrefix: string;

  constructor(protected model: Model<T>) {
    this.cacheTTL = REDIS_CACHE_TTL[model.name as RepositoryName] || 300;
    this.cachePrefix = `${model.name}`;
  }

  setCache(cache: RedisCache): void {
    this.cache = cache;
  }

  protected getCacheKey(filter: Partial<T>, limit?: number): string {
    const filterStr = JSON.stringify(filter, Object.keys(filter).sort());
    const key = limit ? `${filterStr}:limit:${limit}` : filterStr;
    return `${this.cachePrefix}${key}`;
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const result = await retryWithBackoff(
        async () => await this.model.create(data),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (this.cache) {
        const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
        await this.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error(`DB create failed for ${this.model.modelName}:`, {
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey({ _id: id } as Partial<T>);
      if (this.cache) {
        const cached = await this.cache.get<T>(cacheKey);
        if (cached) return cached;
      }
      const result = await retryWithBackoff(
        async () => await this.model.findById(id),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (result && this.cache) {
        await this.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error(`DB findById failed for ${this.model.modelName}:`, {
        id,
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(filter);

      if (this.cache) {
        const cached = await this.cache.get<T>(cacheKey);
        if (cached) return cached;
      }

      const result = await retryWithBackoff(
        async () => await this.model.findOne(filter as any),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (result && this.cache) {
        await this.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error(`DB findOne failed for ${this.model.modelName}:`, {
        filter,
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  async find(filter: Partial<T> = {}, limit?: number): Promise<T[]> {
    try {
      const cacheKey = this.getCacheKey(filter, limit);

      if (this.cache) {
        const cached = await this.cache.get<T[]>(cacheKey);
        if (cached) return cached;
      }

      const query = this.model.find(filter as any);
      if (limit) query.limit(limit);

      const results = await retryWithBackoff(async () => await query, {
        shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
      });

      if (this.cache) {
        await this.cache.set(cacheKey, results, this.cacheTTL);
      }
      return results;
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error(`DB find failed for ${this.model.modelName}:`, {
        filter,
        limit,
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  async updateOne(filter: Partial<T>, update: Partial<T>): Promise<T | null> {
    try {
      const result = await retryWithBackoff(
        async () =>
          await this.model.findOneAndUpdate(filter as any, update as any, {
            new: true,
            upsert: false,
          }),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (result && this.cache) {
        const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
        await this.cache.set(cacheKey, result, this.cacheTTL);
        await this.invalidateRelatedCache(filter);
      }

      return result;
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error(`DB updateOne failed for ${this.model.modelName}:`, {
        filter,
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  async upsert(filter: Partial<T>, update: Partial<T>): Promise<T> {
    try {
      const result = await retryWithBackoff(
        async () =>
          await this.model.findOneAndUpdate(filter as any, update as any, {
            new: true,
            upsert: true,
          }),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (this.cache) {
        const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
        await this.cache.set(cacheKey, result, this.cacheTTL);
        await this.invalidateRelatedCache(filter);
      }

      return result;
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error(`DB upsert failed for ${this.model.modelName}:`, {
        filter,
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  async deleteOne(filter: Partial<T>): Promise<boolean> {
    try {
      const result = await retryWithBackoff(
        async () => await this.model.deleteOne(filter as any),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (result.deletedCount > 0 && this.cache) {
        await this.invalidateRelatedCache(filter);
      }

      return result.deletedCount > 0;
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error(`DB deleteOne failed for ${this.model.modelName}:`, {
        filter,
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  async count(filter: Partial<T> = {}): Promise<number> {
    try {
      return await retryWithBackoff(
        async () => await this.model.countDocuments(filter as any),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );
    } catch (error) {
      const dbError = handleMongooseError(error);
      logger.error(`DB count failed for ${this.model.modelName}:`, {
        filter,
        error: dbError.message,
        code: dbError.code,
      });
      throw dbError;
    }
  }

  protected async invalidateRelatedCache(filter: Partial<T>): Promise<void> {
    if (!this.cache) return;

    const pattern = `${this.cachePrefix}*`;
    const deleted = await this.cache.deleteByPattern(pattern);

    if (deleted > 0) {
      logger.debug(
        `Invalidated ${deleted} cache entries for ${this.model.modelName}`
      );
    }
  }

  async clearCache(): Promise<void> {
    if (!this.cache) return;
    const pattern = `${this.cachePrefix}*`;
    await this.cache.deleteByPattern(pattern);
    logger.debug(`Cleared all cache for ${this.model.modelName}`);
  }
}
