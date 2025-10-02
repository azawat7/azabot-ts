import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { logger } from "@shaw/utils";
import {
  CSRF_TOKEN_EXPIRY,
  CSRF_TOKEN_LENGTH,
  CSRF_TOKEN_NAME,
  env,
} from "../config";
import crypto from "crypto";
import { SessionManager } from "../auth";
import { DatabaseManager } from "@shaw/database";

export class CSRFService {
  private static readonly CSRF_PREFIX = "csrf:";
  private static db = DatabaseManager.getInstance();

  private static getCacheKey(sessionId: string): string {
    return `${this.CSRF_PREFIX}${sessionId}`;
  }

  static async generateToken(): Promise<string | null> {
    const session = await SessionManager.getSession();

    if (!session) {
      logger.warn("CSRF verification failed: No active session");
      return null;
    }

    const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");

    try {
      const key = this.getCacheKey(session.sessionId);
      await this.db.cache.set(
        key,
        { token, createdAt: Date.now() },
        CSRF_TOKEN_EXPIRY
      );

      logger.debug(`Generated CSRF token for session ${session.sessionId}`);
      return token;
    } catch (error) {
      logger.error("Failed to store CSRF token:", error);
      return null;
    }
  }

  static async verifyToken(providedToken: string): Promise<boolean> {
    try {
      const session = await SessionManager.getSession();

      if (!session) {
        logger.warn("CSRF verification failed: No active session");
        return false;
      }

      const key = this.getCacheKey(session.sessionId);
      const entry = await this.db.cache.get<{
        token: string;
        createdAt: number;
      }>(key);

      if (!entry) {
        logger.warn("CSRF verification failed: No token found for session");
        return false;
      }

      const now = Date.now();
      if (now - entry.createdAt > CSRF_TOKEN_EXPIRY * 1000) {
        logger.warn("CSRF verification failed: Token expired");
        await this.db.cache.delete(key);
        return false;
      }

      const isValid = this.timingSafeEqual(providedToken, entry.token);

      if (!isValid) {
        logger.warn("CSRF verification failed: Token mismatch");
      }

      return isValid;
    } catch (error) {
      logger.error("CSRF verification error:", error);
      return false;
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      const session = await SessionManager.getSession();

      if (!session) {
        return null;
      }

      const key = this.getCacheKey(session.sessionId);
      const entry = await this.db.cache.get<{
        token: string;
        createdAt: number;
      }>(key);

      if (!entry) {
        return null;
      }

      const now = Date.now();
      if (now - entry.createdAt > CSRF_TOKEN_EXPIRY * 1000) {
        await this.db.cache.delete(key);
        return null;
      }

      return entry.token;
    } catch (error) {
      logger.error("Error getting CSRF token:", error);
      return null;
    }
  }

  static async clearToken(sessionId: string): Promise<void> {
    try {
      const key = this.getCacheKey(sessionId);
      await this.db.cache.delete(key);
      logger.debug(`Cleared CSRF token for session ${sessionId}`);
    } catch (error) {
      logger.error("Error clearing CSRF token:", error);
    }
  }

  private static timingSafeEqual(a: string, b: string): boolean {
    const maxLength = CSRF_TOKEN_LENGTH * 2;

    const paddedA = a.padEnd(maxLength, "\0");
    const paddedB = b.padEnd(maxLength, "\0");

    const bufA = Buffer.from(paddedA);
    const bufB = Buffer.from(paddedB);

    return crypto.timingSafeEqual(bufA, bufB);
  }

  static async cleanup(): Promise<void> {
    try {
      await this.db.ensureConnection();
      const pattern = `${this.CSRF_PREFIX}*`;
      const deletedCount = await this.db.cache.deleteByPattern(pattern);

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} CSRF tokens`);
      }
    } catch (error) {
      logger.error("Error cleaning up CSRF tokens:", error);
    }
  }
}
