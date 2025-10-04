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
  guild?: any;
  error?: GuildError;
}

export interface UserGuild {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
}

const ADMIN_GUILDS_CACHE_TTL = 60 * 15; // 15 minutes

export class GuildService {
  private static readonly ADMINISTRATOR = BigInt(0x8);
  private static readonly MANAGE_GUILD = BigInt(0x20);
  private static readonly CACHE_PREFIX = "adminGuilds:";

  static async getUserGuilds(
    userId: string,
    discordToken: string
  ): Promise<{
    guilds: UserGuild[];
    cached: boolean;
  }> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    const cachedGuilds = await db.cache.get<UserGuild[]>(cacheKey);

    if (cachedGuilds) {
      return { guilds: cachedGuilds, cached: true };
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
      }));

      await db.cache.set(cacheKey, formattedGuilds, ADMIN_GUILDS_CACHE_TTL);
      return { guilds: formattedGuilds, cached: false };
    } catch (error) {
      logger.error("Error fetching user guilds:", error);
      throw new Error(GuildError.DISCORD_API_ERROR);
    }
  }

  static async getGuildWithPermissions(
    guildId: string,
    userId: string,
    discordToken: string
  ): Promise<{
    info: { id: string; name: string; icon: string | null };
    modules: any;
  }> {
    const permissionResult = await this.validateGuildAccess(
      guildId,
      userId,
      discordToken
    );

    if (!permissionResult.hasPermission) {
      throw new Error(permissionResult.error || GuildError.NO_PERMISSION);
    }

    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    const guildSettings = await db.guilds.get(guildId);
    if (!guildSettings) {
      throw new Error(GuildError.BOT_NOT_IN_SERVER);
    }

    return {
      info: {
        id: permissionResult.guild!.id,
        name: permissionResult.guild!.name,
        icon: permissionResult.guild!.icon,
      },
      modules: guildSettings.modules,
    };
  }

  static async validateGuildAccess(
    guildId: string,
    userId: string,
    discordToken: string
  ): Promise<GuildPermissionResult> {
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
        return {
          hasPermission: false,
          error: GuildError.NOT_FOUND,
        };
      }

      const hasPermission = this.hasAdminPermission(guild.permissions);

      if (!hasPermission) {
        return {
          hasPermission: false,
          error: GuildError.NO_PERMISSION,
        };
      }

      return {
        hasPermission: true,
        guild,
      };
    } catch (error) {
      logger.error("Error validating guild access:", error);
      return {
        hasPermission: false,
        error: GuildError.INTERNAL_ERROR,
      };
    }
  }

  private static filterAdminGuilds(guilds: any[]): any[] {
    return guilds.filter((guild: any) => {
      return this.hasAdminPermission(guild.permissions);
    });
  }

  private static hasAdminPermission(permissions: string): boolean {
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
