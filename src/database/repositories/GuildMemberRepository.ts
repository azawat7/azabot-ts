import { Snowflake } from "discord.js";
import { GuildMember, IGuildMember } from "../models/GuildMember";
import { BaseRepository } from "@/database/repositories/BaseRepository";

export class GuildMemberRepository extends BaseRepository<IGuildMember> {
  constructor() {
    super(GuildMember);
  }

  async getOrCreate(
    guildId: Snowflake,
    userId: Snowflake
  ): Promise<IGuildMember> {
    return await this.upsert({ guildId, userId } as Partial<IGuildMember>, {
      guildId,
      userId,
    });
  }
}
