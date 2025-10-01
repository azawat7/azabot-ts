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

interface CSRFTokenEntry {
  token: string;
  createdAt: number;
  sessionId: string;
}

class CSRFTokenStore {
  private tokens = new Map<string, CSRFTokenEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired tokens every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  set(sessionId: string, token: string): void {
    this.tokens.set(sessionId, {
      token,
      createdAt: Date.now(),
      sessionId,
    });
  }

  get(sessionId: string): CSRFTokenEntry | undefined {
    return this.tokens.get(sessionId);
  }

  delete(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, entry] of this.tokens.entries()) {
      if (now - entry.createdAt > CSRF_TOKEN_EXPIRY) {
        this.tokens.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired CSRF tokens`);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.tokens.clear();
  }
}

const tokenStore = new CSRFTokenStore();

export class CSRFService {
  static async generateToken(): Promise<string> {
    const session = await SessionManager.getSession();

    if (!session) {
      throw new Error("No active session found");
    }

    const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");

    tokenStore.set(session.sessionId, token);

    return token;
  }

  static async verifyToken(providedToken: string): Promise<boolean> {
    try {
      const session = await SessionManager.getSession();

      if (!session) {
        logger.warn("CSRF verification failed: No active session");
        return false;
      }

      const entry = tokenStore.get(session.sessionId);

      if (!entry) {
        logger.warn("CSRF verification failed: No token found for session");
        return false;
      }

      const now = Date.now();
      if (now - entry.createdAt > CSRF_TOKEN_EXPIRY * 1000) {
        logger.warn("CSRF verification failed: Token expired");
        tokenStore.delete(session.sessionId);
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

      const entry = tokenStore.get(session.sessionId);

      if (!entry) {
        return null;
      }

      const now = Date.now();
      if (now - entry.createdAt > CSRF_TOKEN_EXPIRY) {
        tokenStore.delete(session.sessionId);
        return null;
      }

      return entry.token;
    } catch (error) {
      logger.error("Error getting CSRF token:", error);
      return null;
    }
  }

  static async clearToken(): Promise<void> {
    try {
      const session = await SessionManager.getSession();

      if (session) {
        tokenStore.delete(session.sessionId);
      }
    } catch (error) {
      logger.error("Error clearing CSRF token:", error);
    }
  }

  private static timingSafeEqual(a: string, b: string): boolean {
    const maxLength = CSRF_TOKEN_LENGTH * 4;

    const paddedA = a.padEnd(maxLength, "\0");
    const paddedB = b.padEnd(maxLength, "\0");

    const bufA = Buffer.from(paddedA);
    const bufB = Buffer.from(paddedB);

    return crypto.timingSafeEqual(bufA, bufB);
  }
}
