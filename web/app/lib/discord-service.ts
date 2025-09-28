import { DiscordTokenResponse, DiscordUser } from "./types";
import { DISCORD_CONFIG } from "./discord";
import { logger } from "@shaw/utils";

export class DiscordService {
  static async refreshToken(
    refreshToken: string
  ): Promise<DiscordTokenResponse | null> {
    try {
      const response = await fetch(DISCORD_CONFIG.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: DISCORD_CONFIG.clientId,
          client_secret: DISCORD_CONFIG.clientSecret,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        logger.error("Failed to refresh Discord token:", response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error("Error refreshing Discord token:", error);
      return null;
    }
  }

  static async getUser(accessToken: string): Promise<DiscordUser | null> {
    try {
      const response = await fetch(DISCORD_CONFIG.userUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        logger.error("Failed to fetch Discord user:", response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error("Error fetching Discord user:", error);
      return null;
    }
  }

  static async revokeToken(accessToken: string): Promise<void> {
    try {
      await fetch("https://discord.com/api/oauth2/token/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: DISCORD_CONFIG.clientId,
          client_secret: DISCORD_CONFIG.clientSecret,
          token: accessToken,
        }),
      });
    } catch (error) {
      logger.error("Failed to revoke Discord token:", error);
    }
  }

  static async makeAPICall(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<Response> {
    return fetch(`https://discord.com/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  static isTokenExpired(expiryDate: Date): boolean {
    return Date.now() > expiryDate.getTime() - 5 * 60 * 1000;
  }
}
