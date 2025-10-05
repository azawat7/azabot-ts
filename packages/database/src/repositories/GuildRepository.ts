import { IGuild, ModuleSettings, SubcategoryKeys } from "@shaw/types";
import { Snowflake } from "discord.js";
import { BaseRepository } from "./BaseRepository";
import { Guild } from "../models/Guild";

export class GuildRepository extends BaseRepository<IGuild> {
  constructor() {
    super(Guild);
  }

  protected getEntityKey(entity: Partial<IGuild>): string | null {
    if (entity.guildId) return entity.guildId;
    if ((entity as any)._id) return (entity as any)._id.toString();
    return null;
  }

  async get(guildId: Snowflake): Promise<IGuild | null> {
    return await this.findOne({ guildId });
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

  async toggleCommand(
    guildId: Snowflake,
    commandName: string
  ): Promise<IGuild | null> {
    const guild = await this.getOrCreate(guildId);
    const disabledCommands = (guild as any).disabledCommands || [];

    const isDisabled = disabledCommands.includes(commandName);

    if (isDisabled) {
      const updatedCommands = disabledCommands.filter(
        (cmd: string) => cmd !== commandName
      );
      return await this.updateOne({ guildId }, {
        disabledCommands: updatedCommands,
      } as any);
    } else {
      const updatedCommands = [...disabledCommands, commandName];
      return await this.updateOne({ guildId }, {
        disabledCommands: updatedCommands,
      } as any);
    }
  }

  async getDisabledCommands(guildId: Snowflake): Promise<string[]> {
    const guild = await this.getOrCreate(guildId);
    return (guild as any).disabledCommands || [];
  }
}
