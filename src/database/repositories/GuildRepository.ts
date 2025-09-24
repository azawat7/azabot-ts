import { Snowflake } from "discord.js";
import { Guild, IGuild } from "db/models/Guild";
import { BaseRepository } from "db/repositories/BaseRepository";
import { AllSettingKeys, ModuleSettings, SubcategoryKeys } from "@/types";

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

  async updateModuleSetting<T extends keyof ModuleSettings>(
    guildId: Snowflake,
    module: T,
    subCategory: SubcategoryKeys<T>,
    setting: AllSettingKeys,
    newSetting: any
  ): Promise<IGuild | null> {
    const updatePath = `modules.${module}.${String(subCategory)}.${setting}`;
    return await this.updateOne({ guildId }, { [updatePath]: newSetting });
  }
}