import { Snowflake } from "discord.js";
import { Guild, IGuild } from "db/models/Guild";
import { BaseRepository } from "db/repositories/BaseRepository";

export class GuildRepository extends BaseRepository<IGuild> {
  constructor() {
    super(Guild, {
      ttl: 10 * 60 * 1000,
      maxSize: 5000,
    });
  }

  async getOrCreate(guildId: Snowflake): Promise<IGuild> {
    const result = await this.findOne({ guildId });
    if (!result) return await this.create({ guildId });
    return result;
  }
}
