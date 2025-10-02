import { Snowflake } from "discord.js";
import { GuildMember } from "../models/GuildMember";
import { IGuildMember, LevelFormula } from "@shaw/types";
import { BaseRepository } from "./BaseRepository";
import { LevelUtils, logger } from "@shaw/utils";

export class GuildMemberRepository extends BaseRepository<IGuildMember> {
  constructor() {
    super(GuildMember);
  }

  protected getEntityKey(entity: Partial<IGuildMember>): string | null {
    if (entity.guildId && entity.userId) {
      return `${entity.guildId}:${entity.userId}`;
    }
    if ((entity as any)._id) return (entity as any)._id.toString();
    return null;
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
    xpAmount: number,
    formula: LevelFormula
  ): Promise<{ member: IGuildMember; leveledUp: boolean }> {
    const member = await this.getOrCreate(guildId, userId);
    const result = LevelUtils.addXP(member.xp, xpAmount, formula);

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

  async getRank(guildId: Snowflake, userId: Snowflake): Promise<number | null> {
    try {
      const member = await this.getOrCreate(guildId, userId);
      const rank = await this.model.countDocuments({
        guildId,
        xp: { $gt: member.xp },
      });

      return rank + 1;
    } catch (e) {
      logger.error("DB getRank:", e);
      throw e;
    }
  }
}
