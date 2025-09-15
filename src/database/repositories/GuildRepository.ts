import { Snowflake } from "discord.js";
import { Guild, IGuild } from "../models/Guild";
import { BaseRepository } from "@/database/repositories/BaseRepository";

export class GuildRepository extends BaseRepository<IGuild> {
  constructor() {
    super(Guild);
  }

  async getOrCreate(guildId: Snowflake): Promise<IGuild> {
    return await this.upsert({ guildId } as Partial<IGuild>, {
      guildId,
    });
  }
}
