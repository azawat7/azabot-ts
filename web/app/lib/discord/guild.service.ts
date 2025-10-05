import { DiscordService } from "@/app/lib/discord";
import { DatabaseManager } from "@shaw/database";
import { logger } from "@shaw/utils";

export enum GuildError {
  NOT_FOUND = "GUILD_NOT_FOUND",
  NO_PERMISSION = "INSUFFICIENT_PERMISSIONS",
  BOT_NOT_IN_SERVER = "BOT_NOT_IN_SERVER",
  DISCORD_API_ERROR = "DISCORD_API_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface GuildPermissionResult {
  hasPermission: boolean;
  guild?: UserGuild;
  error?: GuildError;
}

export interface UserGuild {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
  owner: boolean;
}

export interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

const ADMIN_GUILDS_CACHE_TTL = 60 * 15; // 15 minutes
const GUILD_ACCESS_CACHE_TTL = 60 * 5; // 5 minutes

export class GuildService {
  private static readonly ADMINISTRATOR = BigInt(0x8);
  private static readonly MANAGE_GUILD = BigInt(0x20);
  private static readonly CACHE_PREFIX = "adminGuilds:";
  private static readonly GUILD_ACCESS_CACHE_PREFIX = "guildAccess:";

  static async getUserAdminGuilds(
    userId: string,
    discordToken: string
  ): Promise<{
    guilds: UserGuild[];
  }> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    const cachedGuilds = await db.cache.get<UserGuild[]>(cacheKey);

    if (cachedGuilds) {
      return { guilds: cachedGuilds };
    }

    try {
      const response = await DiscordService.makeAPICall(
        "/users/@me/guilds",
        discordToken
      );

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      const guilds = await response.json();
      const adminGuilds = this.filterAdminGuilds(guilds);
      const formattedGuilds = adminGuilds.map((guild: any) => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        permissions: guild.permissions,
        owner: guild.owner || false,
      }));

      await db.cache.set(cacheKey, formattedGuilds, ADMIN_GUILDS_CACHE_TTL);
      return { guilds: formattedGuilds };
    } catch (error) {
      logger.error("Error fetching user guilds:", error);
      throw new Error(GuildError.DISCORD_API_ERROR);
    }
  }

  static async validateGuildAccess(
    guildId: string,
    discordToken: string,
    userId?: string
  ): Promise<GuildPermissionResult> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    if (userId) {
      const cacheKey = `${this.GUILD_ACCESS_CACHE_PREFIX}${userId}:${guildId}`;
      const cachedResult = await db.cache.get<GuildPermissionResult>(cacheKey);

      if (cachedResult) {
        return cachedResult;
      }
    }

    try {
      const response = await DiscordService.makeAPICall(
        "/users/@me/guilds",
        discordToken
      );

      if (!response.ok) {
        return {
          hasPermission: false,
          error: GuildError.DISCORD_API_ERROR,
        };
      }

      const guilds = await response.json();
      const guild = guilds.find((g: any) => g.id === guildId);

      if (!guild) {
        const result: GuildPermissionResult = {
          hasPermission: false,
          error: GuildError.NOT_FOUND,
        };
        if (userId) {
          const cacheKey = `${this.GUILD_ACCESS_CACHE_PREFIX}${userId}:${guildId}`;
          await db.cache.set(cacheKey, result, GUILD_ACCESS_CACHE_TTL);
        }
        return result;
      }

      const hasPermission = this.hasAdminPermission(guild.permissions);

      if (!hasPermission) {
        const result: GuildPermissionResult = {
          hasPermission: false,
          error: GuildError.NO_PERMISSION,
        };
        if (userId) {
          const cacheKey = `${this.GUILD_ACCESS_CACHE_PREFIX}${userId}:${guildId}`;
          await db.cache.set(cacheKey, result, GUILD_ACCESS_CACHE_TTL);
        }
        return result;
      }

      const result: GuildPermissionResult = {
        hasPermission: true,
        guild,
      };

      if (userId) {
        const cacheKey = `${this.GUILD_ACCESS_CACHE_PREFIX}${userId}:${guildId}`;
        await db.cache.set(cacheKey, result, GUILD_ACCESS_CACHE_TTL);
      }

      return result;
    } catch (error) {
      logger.error("Error validating guild access:", error);
      return {
        hasPermission: false,
        error: GuildError.INTERNAL_ERROR,
      };
    }
  }

  private static filterAdminGuilds(guilds: any[]): any[] {
    return guilds.filter((guild: any) =>
      this.hasAdminPermission(guild.permissions)
    );
  }

  static hasAdminPermission(permissions: string): boolean {
    const permissionsBigInt = BigInt(permissions);
    return (
      (permissionsBigInt & this.ADMINISTRATOR) === this.ADMINISTRATOR ||
      (permissionsBigInt & this.MANAGE_GUILD) === this.MANAGE_GUILD
    );
  }

  static async clearUserGuildCache(userId: string): Promise<void> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await db.cache.delete(cacheKey);
  }

  static async clearGuildAccessCache(
    userId: string,
    guildId?: string
  ): Promise<void> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    if (guildId) {
      const cacheKey = `${this.GUILD_ACCESS_CACHE_PREFIX}${userId}:${guildId}`;
      await db.cache.delete(cacheKey);
    } else {
      const pattern = `${this.GUILD_ACCESS_CACHE_PREFIX}${userId}:*`;
      await db.cache.deleteByPattern(pattern);
    }
  }

  static async clearAllUserCaches(userId: string): Promise<void> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    await this.clearUserGuildCache(userId);

    await this.clearGuildAccessCache(userId);
  }

  static getErrorStatusCode(error: GuildError): number {
    switch (error) {
      case GuildError.NOT_FOUND:
      case GuildError.BOT_NOT_IN_SERVER:
        return 404;
      case GuildError.NO_PERMISSION:
        return 403;
      case GuildError.DISCORD_API_ERROR:
        return 502;
      case GuildError.INTERNAL_ERROR:
      default:
        return 500;
    }
  }

  static getErrorMessage(error: GuildError): string {
    switch (error) {
      case GuildError.NOT_FOUND:
        return "Guild not found or you don't have access to it";
      case GuildError.NO_PERMISSION:
        return "You don't have sufficient permissions to manage this server";
      case GuildError.BOT_NOT_IN_SERVER:
        return "Bot is not added to this server";
      case GuildError.DISCORD_API_ERROR:
        return "Failed to verify guild access with Discord";
      case GuildError.INTERNAL_ERROR:
      default:
        return "Internal server error";
    }
  }
}
