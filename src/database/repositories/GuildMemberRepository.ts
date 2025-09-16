import { Snowflake } from "discord.js";
import { GuildMember, IGuildMember } from "db/models/GuildMember";
import { BaseRepository } from "db/repositories/BaseRepository";

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
}
