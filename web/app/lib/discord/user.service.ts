import { TOKEN_EXPIRY_BUFFER } from "../config";
import { DiscordTokenResponse, DiscordUser } from "../types";
import { DISCORD_CONFIG } from ".";
import { logger } from "@shaw/utils";

export class DiscordService {
  private static async makeRequest(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok && response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      logger.warn(
        `Rate limited. Retry after: ${retryAfter || "unknown"} seconds`
      );
    }

    return response;
  }

  static async refreshToken(
    refreshToken: string
  ): Promise<DiscordTokenResponse | null> {
    try {
      const response = await this.makeRequest(DISCORD_CONFIG.tokenUrl, {
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
        const errorData = await response.json().catch(() => ({}));
        logger.error("Failed to refresh Discord token:", {
          status: response.status,
          error: errorData,
        });
        return null;
      }

      const tokenData = await response.json();
      return tokenData;
    } catch (error) {
      logger.error("Error refreshing Discord token:", error);
      return null;
    }
  }

  static async getUser(accessToken: string): Promise<DiscordUser | null> {
    try {
      const response = await this.makeRequest(DISCORD_CONFIG.userUrl, {
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

  static async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(
        "https://discord.com/api/oauth2/token/revoke",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: DISCORD_CONFIG.clientId,
            client_secret: DISCORD_CONFIG.clientSecret,
            token: accessToken,
          }),
        }
      );

      if (response.ok) {
        logger.info("Successfully revoked Discord token");
        return true;
      } else {
        logger.error("Failed to revoke Discord token:", response.status);
        return false;
      }
    } catch (error) {
      logger.error("Failed to revoke Discord token:", error);
      return false;
    }
  }

  static async makeAPICall(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<Response> {
    return this.makeRequest(`https://discord.com/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  static async makeBotAPICall(
    endpoint: string,
    botToken: string,
    options: RequestInit = {}
  ): Promise<Response> {
    return this.makeRequest(`https://discord.com/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  static isTokenExpired(expiryDate: Date): boolean {
    return Date.now() > expiryDate.getTime() - TOKEN_EXPIRY_BUFFER;
  }

  static async exchangeCode(
    code: string,
    redirectUri: string
  ): Promise<DiscordTokenResponse | null> {
    try {
      const response = await this.makeRequest(DISCORD_CONFIG.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: DISCORD_CONFIG.clientId,
          client_secret: DISCORD_CONFIG.clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("Failed to exchange code for token:", {
          status: response.status,
          error: errorData,
        });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error("Error exchanging code for token:", error);
      return null;
    }
  }
}
