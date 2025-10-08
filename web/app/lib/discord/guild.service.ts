import { DiscordService } from "@/app/lib/discord";
import { DatabaseManager } from "@shaw/database";
import { logger } from "@shaw/utils";
import { APIChannel, APIRole, ChannelType } from "discord-api-types/v10";
import { webEnv } from "@/app/lib/config";

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

export interface CachedRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export interface CachedChannel {
  id: string;
  name: string;
  position: number;
  type: number;
}

const ADMIN_GUILDS_CACHE_TTL = 60 * 15; // 15 minutes
const GUILD_ACCESS_CACHE_TTL = 60 * 5; // 5 minutes
const GUILD_ROLES_CACHE_TTL = 60 * 60; // 60 minutes
const GUILD_CHANNELS_CACHE_TTL = 60 * 60; // 60 minutes

export class GuildService {
  private static readonly ADMINISTRATOR = BigInt(0x8);
  private static readonly MANAGE_GUILD = BigInt(0x20);
  private static readonly CACHE_PREFIX = "adminGuilds:";
  private static readonly GUILD_ACCESS_CACHE_PREFIX = "guildAccess:";
  private static readonly GUILD_ROLES_CACHE_PREFIX = "guildRoles:";
  private static readonly GUILD_CHANNELS_CACHE_PREFIX = "guildChannels:";

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

  static async getGuildRoles(guildId: string): Promise<{
    roles: CachedRole[];
  }> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    const cacheKey = `${this.GUILD_ROLES_CACHE_PREFIX}${guildId}`;
    const cachedRoles = await db.cache.get<CachedRole[]>(cacheKey);

    if (cachedRoles) {
      return { roles: cachedRoles };
    }

    try {
      const response = await DiscordService.makeBotAPICall(
        `/guilds/${guildId}/roles`,
        webEnv.botToken
      );

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      const roles: APIRole[] = await response.json();

      const cachedRolesData: CachedRole[] = roles.map((role) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
        managed: role.managed,
      }));

      await db.cache.set(cacheKey, cachedRolesData, GUILD_ROLES_CACHE_TTL);

      return { roles: cachedRolesData };
    } catch (error) {
      logger.error("Error fetching guild roles:", error);
      throw new Error(GuildError.DISCORD_API_ERROR);
    }
  }

  static async getGuildChannels(guildId: string): Promise<{
    channels: CachedChannel[];
  }> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    const cacheKey = `${this.GUILD_CHANNELS_CACHE_PREFIX}${guildId}`;
    const cachedChannels = await db.cache.get<CachedChannel[]>(cacheKey);

    if (cachedChannels) {
      return { channels: cachedChannels };
    }

    try {
      const response = await DiscordService.makeBotAPICall(
        `/guilds/${guildId}/channels`,
        webEnv.botToken
      );

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      const channels: APIChannel[] = await response.json();

      const textAndVoiceChannels = channels.filter(
        (channel) =>
          channel.type === ChannelType.GuildText ||
          channel.type === ChannelType.GuildAnnouncement ||
          channel.type === ChannelType.GuildVoice
      );

      const cachedChannelsData: CachedChannel[] = textAndVoiceChannels.map(
        (channel) => ({
          id: channel.id,
          name: channel.name || "Unknown",
          position: (channel as any).position || 0,
          type: channel.type,
        })
      );

      await db.cache.set(
        cacheKey,
        cachedChannelsData,
        GUILD_CHANNELS_CACHE_TTL
      );

      return { channels: cachedChannelsData };
    } catch (error) {
      logger.error("Error fetching guild channels:", error);
      throw new Error(GuildError.DISCORD_API_ERROR);
    }
  }

  static async clearGuildRolesCache(guildId: string): Promise<void> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    const cacheKey = `${this.GUILD_ROLES_CACHE_PREFIX}${guildId}`;
    await db.cache.delete(cacheKey);
  }

  static async clearGuildChannelsCache(guildId: string): Promise<void> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    const cacheKey = `${this.GUILD_CHANNELS_CACHE_PREFIX}${guildId}`;
    await db.cache.delete(cacheKey);
  }

  static async clearGuildDataCache(guildId: string): Promise<void> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    await this.clearGuildRolesCache(guildId);
    await this.clearGuildChannelsCache(guildId);
  }

  static async clearAllGuildCaches(guildId: string): Promise<void> {
    const db = DatabaseManager.getInstance();
    await db.ensureConnection();

    await this.clearGuildRolesCache(guildId);
    await this.clearGuildChannelsCache(guildId);
  }

  static filterRolesByType(
    roles: CachedRole[],
    managed?: boolean
  ): CachedRole[] {
    if (managed === undefined) return roles;
    return roles.filter((role) => role.managed === managed);
  }

  static getRoleById(
    roles: CachedRole[],
    roleId: string
  ): CachedRole | undefined {
    return roles.find((role) => role.id === roleId);
  }

  static getRolesSortedByPosition(roles: CachedRole[]): CachedRole[] {
    return [...roles].sort((a, b) => b.position - a.position);
  }

  static getChannelById(
    channels: CachedChannel[],
    channelId: string
  ): CachedChannel | undefined {
    return channels.find((channel) => channel.id === channelId);
  }

  static getChannelsSortedByPosition(
    channels: CachedChannel[]
  ): CachedChannel[] {
    return [...channels].sort((a, b) => a.position - b.position);
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
