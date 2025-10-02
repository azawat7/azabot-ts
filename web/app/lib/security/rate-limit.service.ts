import { logger } from "@shaw/utils";
import { RATE_LIMIT_CONFIGS } from "../config";
import { DatabaseManager } from "@shaw/database";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private db = DatabaseManager.getInstance();
  private readonly RATELIMIT_PREFIX: string;

  constructor(private config: RateLimitConfig, tier: string) {
    this.RATELIMIT_PREFIX = `rateLimit:${tier}:`;
  }

  private getCacheKey(identifier: string): string {
    return `${this.RATELIMIT_PREFIX}${identifier}`;
  }

  async check(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }> {
    await this.db.ensureConnection();
    const now = Date.now();
    const key = this.getCacheKey(identifier);

    try {
      const entry = await this.db.cache.get<RateLimitEntry>(key);
      if (!entry || now >= entry.resetAt) {
        const newEntry: RateLimitEntry = {
          count: 1,
          resetAt: now + this.config.windowMs,
        };

        const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
        await this.db.cache.set(key, newEntry, ttlSeconds);

        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetAt: newEntry.resetAt,
        };
      }

      if (entry.count < this.config.maxRequests) {
        entry.count++;
        const ttlSeconds = Math.ceil((entry.resetAt - now) / 1000);
        await this.db.cache.set(key, entry, ttlSeconds);

        return {
          allowed: true,
          remaining: this.config.maxRequests - entry.count,
          resetAt: entry.resetAt,
        };
      }
      logger.warn(`Rate limit exceeded for identifier: ${identifier}`);

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    } catch (error) {
      logger.error(`Rate limit check error for ${identifier}:`, error);
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: now + this.config.windowMs,
      };
    }
  }

  async reset(identifier: string): Promise<void> {
    await this.db.ensureConnection();

    try {
      const key = this.getCacheKey(identifier);
      await this.db.cache.delete(key);
      logger.debug(`Reset rate limit for identifier: ${identifier}`);
    } catch (error) {
      logger.error(`Error resetting rate limit for ${identifier}:`, error);
    }
  }

  async cleanup(): Promise<void> {
    await this.db.ensureConnection();

    try {
      const pattern = `${this.RATELIMIT_PREFIX}*`;
      const deletedCount = await this.db.cache.deleteByPattern(pattern);

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} rate limit entries`);
      }
    } catch (error) {
      logger.error(`Error cleaning up rate limit entries`, error);
    }
  }

  getStats(): {
    config: RateLimitConfig;
  } {
    return {
      config: this.config,
    };
  }
}

const rateLimiters = {
  strict: new RateLimiter(RATE_LIMIT_CONFIGS.strict, "strict"),
  moderate: new RateLimiter(RATE_LIMIT_CONFIGS.moderate, "moderate"),
  relaxed: new RateLimiter(RATE_LIMIT_CONFIGS.relaxed, "relaxed"),
  auth: new RateLimiter(RATE_LIMIT_CONFIGS.auth, "auth"),
};

export function getRateLimiter(
  tier: keyof typeof RATE_LIMIT_CONFIGS
): RateLimiter {
  return rateLimiters[tier];
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ip = cfConnectingIp || realIp || forwarded?.split(",")[0].trim();

  return ip || "unknown";
}
