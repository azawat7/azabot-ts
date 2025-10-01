import { logger } from "@shaw/utils";
import { RATE_LIMIT_CONFIGS } from "../config";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private config: RateLimitConfig) {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  async check(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now >= entry.resetAt) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + this.config.windowMs,
      };
      this.store.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: newEntry.resetAt,
      };
    }

    if (entry.count < this.config.maxRequests) {
      entry.count++;
      this.store.set(identifier, entry);

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
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  getStats(): { totalEntries: number; config: RateLimitConfig } {
    return {
      totalEntries: this.store.size,
      config: this.config,
    };
  }
}

const rateLimiters = {
  strict: new RateLimiter(RATE_LIMIT_CONFIGS.strict),
  moderate: new RateLimiter(RATE_LIMIT_CONFIGS.moderate),
  relaxed: new RateLimiter(RATE_LIMIT_CONFIGS.relaxed),
  auth: new RateLimiter(RATE_LIMIT_CONFIGS.auth),
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
