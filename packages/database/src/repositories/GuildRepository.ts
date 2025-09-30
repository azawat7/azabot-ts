import { IGuild, ModuleSettings, SubcategoryKeys } from "@shaw/types";
import { Snowflake } from "discord.js";
import { BaseRepository } from "./BaseRepository";
import { Guild } from "../models/Guild";

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
    module: keyof ModuleSettings
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

  async updateModuleSetting<
    T extends keyof ModuleSettings,
    S extends SubcategoryKeys<T>,
    K extends keyof ModuleSettings[T][S]
  >(
    guildId: Snowflake,
    module: T,
    subCategory: S,
    setting: K,
    newSetting: ModuleSettings[T][S][K]
  ): Promise<IGuild | null> {
    const updatePath = `modules.${module}.${String(subCategory)}.${String(
      setting
    )}`;
    return await this.updateOne({ guildId }, { [updatePath]: newSetting });
  }
}
