import { logger } from "@shaw/utils";
import { DatabaseManager } from "../DatabaseManager";
import {
  CACHE_CLEANUP_INTERVAL,
  SESSION_CLEANUP_INTERVAL,
  SESSION_DURATION,
} from "../config";

export class ScheduledTasks {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static cacheCleanupInterval: NodeJS.Timeout | null = null;

  static async startSessionCleanup(): Promise<void> {
    if (this.cleanupInterval) {
      logger.warn("Session cleanup task is already running");
      return;
    }

    logger.info("Starting scheduled session cleanup task");

    await this.cleanupExpiredSessions();

    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, SESSION_CLEANUP_INTERVAL);
  }

  static async startCacheCleanup(): Promise<void> {
    if (this.cacheCleanupInterval) {
      logger.warn("Cache cleanup task is already running");
      return;
    }

    logger.info("Starting scheduled cache cleanup task");

    await this.cleanupExpiredCaches();

    this.cacheCleanupInterval = setInterval(async () => {
      await this.cleanupExpiredCaches();
    }, CACHE_CLEANUP_INTERVAL);
  }

  private static async cleanupExpiredSessions(): Promise<void> {
    try {
      const db = DatabaseManager.getInstance();
      await db.ensureConnection();

      const expiredDate = new Date(Date.now() - SESSION_DURATION);
      const result = await db.sessions.cleanupExpiredSessions(expiredDate);

      if (result > 0) {
        logger.info(`Cleaned up ${result} expired sessions`);
      }
    } catch (error) {
      logger.error("Error in scheduled session cleanup:", error);
    }
  }

  private static async cleanupExpiredCaches(): Promise<void> {
    try {
      const db = DatabaseManager.getInstance();

      if (!db.isConnectionReady()) {
        logger.debug("Database not ready, skipping cache cleanup");
        return;
      }

      db.cleanupAllCaches();

      const stats = db.getCacheStats();
      logger.debug("Cache stats after cleanup:", stats);
    } catch (error) {
      logger.error("Error in scheduled cache cleanup:", error);
    }
  }

  static stopSessionCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info("Session cleanup task stopped");
    }
  }

  static stopCacheCleanup(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
      logger.info("Cache cleanup task stopped");
    }
  }

  static stopAll(): void {
    this.stopSessionCleanup();
    this.stopCacheCleanup();
  }

  static async startAll(): Promise<void> {
    await Promise.all([this.startSessionCleanup(), this.startCacheCleanup()]);
  }
}
