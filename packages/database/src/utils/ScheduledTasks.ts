import { logger } from "@shaw/utils";
import { DatabaseManager } from "../DatabaseManager";
import { SESSION_CLEANUP_INTERVAL, SESSION_DURATION } from "../config";

export class ScheduledTasks {
  private static cleanupInterval: NodeJS.Timeout | null = null;

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

  static stopSessionCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info("Session cleanup task stopped");
    }
  }

  static stopAll(): void {
    this.stopSessionCleanup();
  }

  static async startAll(): Promise<void> {
    await Promise.all([this.startSessionCleanup()]);
  }
}
