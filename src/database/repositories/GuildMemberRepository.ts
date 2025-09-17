import { Snowflake } from "discord.js";
import { GuildMember, IGuildMember } from "db/models/GuildMember";
import { BaseRepository } from "db/repositories/BaseRepository";
import { LevelUtils } from "@/utils/LevelUtils";

export class GuildMemberRepository extends BaseRepository<IGuildMember> {
  constructor() {
    super(GuildMember, {
      ttl: 5 * 60 * 1000,
      maxSize: 5000,
    });
  }

  async getOrCreate(
    guildId: Snowflake,
    userId: Snowflake
  ): Promise<IGuildMember> {
    const result = await this.findOne({ guildId, userId });
    if (!result) return await this.create({ guildId, userId });
    return result;
  }

  async addXP(
    guildId: Snowflake,
    userId: Snowflake,
    xpAmount: number
  ): Promise<{ member: IGuildMember; leveledUp: boolean }> {
    const member = await this.getOrCreate(guildId, userId);

    const result = LevelUtils.addXP(member.xp, xpAmount);

    const updatedMember = await this.updateOne(
      { guildId, userId },
      {
        xp: result.newXP,
        level: result.newLevel,
        lastXPGain: new Date(),
      }
    );

    return {
      member: updatedMember!,
      leveledUp: result.leveledUp,
    };
  }

  async isOnXPCooldown(
    guildId: Snowflake,
    userId: Snowflake,
    cooldownMs: number = 60000
  ): Promise<boolean> {
    const member = await this.getOrCreate(guildId, userId);

    if (!member || !member.lastXPGain) return false;
    const timeSinceLastGain = Date.now() - member.lastXPGain.getTime();
    return timeSinceLastGain < cooldownMs;
  }
}
