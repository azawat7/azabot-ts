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

  protected abstract getEntityKey(entity: Partial<T>): string | null;

  constructor(protected model: Model<T>) {
    this.cacheTTL = REDIS_CACHE_TTL[model.modelName as RepositoryName] || 300;
    this.cachePrefix = `${model.modelName}:`;
  }

  setCache(cache: RedisCache): void {
    this.cache = cache;
  }

  protected getCacheKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }

  protected getCacheKeyFromEntity(entity: Partial<T>): string | null {
    const entityKey = this.getEntityKey(entity);
    return entityKey ? this.getCacheKey(entityKey) : null;
  }

  protected getRandomizedTTL(): number {
    const jitterPercent = 0.1;
    const jitter = this.cacheTTL * jitterPercent * (Math.random() * 2 - 1);
    return Math.floor(this.cacheTTL + jitter);
  }

  protected async cacheEntity(entity: T): Promise<void> {
    if (!this.cache) return;

    const cacheKey = this.getCacheKeyFromEntity(entity);
    if (cacheKey) {
      const ttl = this.getRandomizedTTL();
      await this.cache.set(cacheKey, entity, ttl);
    }
  }

  protected async invalidateEntity(entity: Partial<T>): Promise<void> {
    if (!this.cache) return;

    const cacheKey = this.getCacheKeyFromEntity(entity);
    if (cacheKey) {
      await this.cache.delete(cacheKey);
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const result = await retryWithBackoff(
        async () => await this.model.create(data),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      await this.cacheEntity(result);
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
      const cacheKey = this.getCacheKey(id);
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

      if (result) {
        await this.cacheEntity(result);
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
      const cacheKey = this.getCacheKeyFromEntity(filter);

      if (cacheKey && this.cache) {
        const cached = await this.cache.get<T>(cacheKey);
        if (cached) return cached;
      }

      const result = await retryWithBackoff(
        async () => await this.model.findOne(filter as any),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (result) {
        await this.cacheEntity(result);
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
      const query = this.model.find(filter as any);
      if (limit) query.limit(limit);

      const results = await retryWithBackoff(async () => await query, {
        shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
      });

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

      if (result) {
        await this.invalidateEntity(filter);
        await this.cacheEntity(result);
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

      await this.invalidateEntity(filter);
      await this.cacheEntity(result);

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
      const entity = await this.model.findOne(filter as any);

      const result = await retryWithBackoff(
        async () => await this.model.deleteOne(filter as any),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (result.deletedCount > 0 && entity) {
        await this.invalidateEntity(entity);
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

  async clearCache(): Promise<void> {
    if (!this.cache) return;
    try {
      const pattern = `${this.cachePrefix}*`;
      const deletedCount = await this.cache.deleteByPattern(pattern);

      if (deletedCount > 0) {
        logger.debug(
          `Cleared ${deletedCount} cache entries for ${this.model.modelName}`
        );
      }
    } catch (error) {
      logger.error(`Failed to clear cache for ${this.model.modelName}:`, error);
    }
  }
}
