import { Document, Model } from "mongoose";
import { CacheManager, CacheOptions } from "../utils/CacheManager";
import { logger } from "@shaw/utils";
import { handleMongooseError, isRetryableError } from "../utils/DatabaseErrors";
import { retryWithBackoff } from "../utils/RetryUtils";

export abstract class BaseRepository<T extends Document> {
  protected cache: CacheManager<T>;
  constructor(protected model: Model<T>, cacheOptions: CacheOptions) {
    this.cache = new CacheManager<T>(cacheOptions);
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const result = await retryWithBackoff(
        async () => await this.model.create(data),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
      this.cache.set(cacheKey, result);

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
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const result = await retryWithBackoff(
        async () => await this.model.findById(id),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (result) {
        this.cache.set(cacheKey, result);
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
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const result = await retryWithBackoff(
        async () => await this.model.findOne(filter as any),
        {
          shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
        }
      );

      if (result) {
        this.cache.set(cacheKey, result);
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
      const cached = this.cache.get(cacheKey);
      if (cached) return Array.isArray(cached) ? cached : [cached];

      const query = this.model.find(filter as any);
      if (limit) query.limit(limit);

      const results = await retryWithBackoff(async () => await query, {
        shouldRetry: (error) => isRetryableError(handleMongooseError(error)),
      });

      this.cache.set(cacheKey, results as any);
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
        const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
        this.cache.set(cacheKey, result);
        this.invalidateRelatedCache(filter);
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

      const cacheKey = this.getCacheKey({ _id: result._id } as Partial<T>);
      this.cache.set(cacheKey, result);
      this.invalidateRelatedCache(filter);

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

      if (result.deletedCount > 0) {
        this.invalidateRelatedCache(filter);
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

  protected getCacheKey(filter: Partial<T>, limit?: number): string {
    const filterStr = JSON.stringify(filter, Object.keys(filter).sort());
    return limit ? `${filterStr}:limit:${limit}` : filterStr;
  }

  protected invalidateRelatedCache(filter: Partial<T>): void {
    const filterKeys = Object.keys(filter);

    if (filterKeys.length === 0) {
      this.cache.clear();
      logger.debug(
        `Cleared all cache for ${this.model.modelName} due to empty filter`
      );
      return;
    }

    const deleted = this.cache.deleteByPattern((cacheKey) => {
      try {
        const parsedKey = JSON.parse(cacheKey.split(":limit:")[0]);
        const keyFields = Object.keys(parsedKey);

        return filterKeys.some((filterKey) => keyFields.includes(filterKey));
      } catch (e) {
        return false;
      }
    });

    if (deleted > 0) {
      logger.debug(
        `Invalidated ${deleted} cache entries for ${this.model.modelName}`
      );
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

  getCacheStats() {
    return {
      model: this.model.modelName,
      ...this.cache.getStats(),
    };
  }
}
