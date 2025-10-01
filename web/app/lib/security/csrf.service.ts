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

interface CSRFTokenPayload {
  token: string;
  timestamp: number;
}

export class CSRFService {
  static async generateToken(): Promise<string> {
    const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
    const timestamp = Date.now();

    const payload: CSRFTokenPayload = { token, timestamp };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );

    const cookieStore = await cookies();
    cookieStore.set(CSRF_TOKEN_NAME, encodedPayload, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "strict",
      maxAge: CSRF_TOKEN_EXPIRY,
      path: "/",
    });

    return token;
  }

  static async verifyToken(providedToken: string): Promise<boolean> {
    try {
      const cookieStore = await cookies();
      const csrfCookie = cookieStore.get(CSRF_TOKEN_NAME);

      if (!csrfCookie) {
        logger.warn("CSRF verification failed: No CSRF cookie found");
        return false;
      }

      const payload: CSRFTokenPayload = JSON.parse(
        Buffer.from(csrfCookie.value, "base64").toString()
      );

      const now = Date.now();
      if (now - payload.timestamp > CSRF_TOKEN_EXPIRY * 1000) {
        logger.warn("CSRF verification failed: Token expired");
        return false;
      }

      const isValid = this.timingSafeEqual(providedToken, payload.token);

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
      const cookieStore = await cookies();
      const csrfCookie = cookieStore.get(CSRF_TOKEN_NAME);

      if (!csrfCookie) {
        return null;
      }

      const payload: CSRFTokenPayload = JSON.parse(
        Buffer.from(csrfCookie.value, "base64").toString()
      );

      const now = Date.now();
      if (now - payload.timestamp > CSRF_TOKEN_EXPIRY * 1000) {
        return null;
      }

      return payload.token;
    } catch (error) {
      logger.error("Error getting CSRF token:", error);
      return null;
    }
  }

  static async clearToken(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(CSRF_TOKEN_NAME);
  }

  private static timingSafeEqual(a: string, b: string): boolean {
    const maxLength = CSRF_TOKEN_LENGTH * 4;

    const paddedA = a.padEnd(maxLength, "\0");
    const paddedB = b.padEnd(maxLength, "\0");

    const bufA = Buffer.from(paddedA);
    const bufB = Buffer.from(paddedB);

    const tokensMatch = crypto.timingSafeEqual(bufA, bufB);

    const lengthA = a.length;
    const lengthB = b.length;
    const lengthsMatch = lengthA === lengthB;

    return tokensMatch && lengthsMatch;
  }
}
