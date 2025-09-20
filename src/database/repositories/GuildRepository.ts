import { Snowflake } from "discord.js";
import { Guild, IGuild, IGuildModules } from "db/models/Guild";
import { BaseRepository } from "db/repositories/BaseRepository";
import { ModuleConfigCategory, ModuleSettings } from "@/types/settings.types";

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

  async toggleModule(
    guildId: Snowflake,
    module: keyof IGuildModules
  ): Promise<IGuild | null> {
    const guild = await this.getOrCreate(guildId);
    const moduleSettings = guild.modules[module];
    moduleSettings.enabled = !moduleSettings.enabled;

    const updatePath = `modules.${module}.enabled`;
    return await this.updateOne(
      { guildId },
      { [updatePath]: moduleSettings.enabled }
    );
  }

  async updateModuleSetting(
    guildId: Snowflake,
    module: keyof IGuildModules,
    subCategory: keyof ModuleConfigCategory,
    setting: string, // TODO ADD TYPE
    newSetting: any
  ) {
    const updatePath = `modules.${module}.${subCategory}.${setting}`;
    return await this.updateOne({ guildId }, { [updatePath]: newSetting });
  }
}
