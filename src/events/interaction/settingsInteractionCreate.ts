import {
  AnySelectMenuInteraction,
  ButtonInteraction,
  Interaction,
  MessageFlags,
  PermissionsBitField,
} from "discord.js";
import { CustomBaseClient, BaseEvent } from "@/base";
import { IGuild, IGuildModules } from "@/database/models/Guild";
import { SettingsUtils } from "@/utils/SettingsUtils";
import {
  ALL_MODULE_CONFIGS,
  ConfigOption,
  ModuleConfigCategory,
  ModuleSettings,
} from "@/types/settings.types";

export default class SettingsInteractionCreateEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "interactionCreate");
  }
  async run(interaction: Interaction): Promise<void> {
    if (
      interaction.isAnySelectMenu() &&
      interaction.customId.startsWith("settings") &&
      this.checkIfMemberIsAdmin(interaction)
    ) {
      await this.handleSelectMenuInteraction(interaction);
    }
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("settings") &&
      this.checkIfMemberIsAdmin(interaction)
    ) {
      await this.handleButtonInteraction(interaction);
    }
  }

  private async handleButtonInteraction(interaction: ButtonInteraction) {
    const splitId = interaction.customId.split("-");
    const [, action] = splitId;
    if (action === "homePage" || action === "config") {
      const guildData = await this.client.db.guilds.getOrCreate(
        interaction.guild?.id!
      );

      let moduleName: keyof ModuleSettings | undefined = undefined;
      if (splitId[2]) moduleName = splitId[2] as keyof ModuleSettings;

      interaction.update({
        components: [
          SettingsUtils.createSettingsContainer(
            interaction,
            guildData,
            moduleName
          ),
        ],
      });
    }
    if (action === "toggle") {
      this.handleToggleModuleButton(interaction);
    }
    if (action === "change") {
      this.handleSettingChangeButton(interaction);
    }
  }

  private async handleSelectMenuInteraction(
    interaction: AnySelectMenuInteraction
  ) {
    const [, action] = interaction.customId.split("-");
    if (action === "subcategorySelect") {
      await this.handleSelectMenuNav(interaction);
    }
  }

  //

  private async handleSettingChangeButton(interaction: ButtonInteraction) {
    const [, , moduleName, subCategoryName, settingKey] =
      interaction.customId.split("-") as [
        unknown,
        unknown,
        keyof ModuleSettings,
        string,
        any // TODO ADD TYPE
      ];
    const guildData = await this.client.db.guilds.getOrCreate(
      interaction.guild?.id!
    );

    const moduleConfig = ALL_MODULE_CONFIGS[moduleName];
    const categoryConfig = moduleConfig[subCategoryName];
    const settingConfig = categoryConfig[settingKey] as ConfigOption;

    switch (settingConfig.type) {
      case "boolean":
        await this.handleBooleanSetting(
          interaction,
          guildData,
          moduleName,
          subCategoryName,
          settingKey
        );
        break;

      // case "select":
      //   await this.handleSelectSetting(
      //     interaction,
      //     guildData,
      //     moduleName,
      //     subCategoryName,
      //     settingKey,
      //     settingConfig
      //   );
      //   break;

      // case "text":
      // case "number":
      // case "time":
      //   await this.handleInputSetting(
      //     interaction,
      //     moduleName,
      //     subCategoryName,
      //     settingKey,
      //     settingConfig,
      //     currentValue
      //   );
      //   break;

      // case "array":
      //   await this.handleArraySetting(
      //     interaction,
      //     guildData,
      //     moduleName,
      //     subCategoryName,
      //     settingKey,
      //     settingConfig
      //   );
      // break;
    }
  }

  //

  private async handleBooleanSetting(
    interaction: ButtonInteraction,
    guildData: IGuild,
    moduleName: keyof ModuleSettings,
    subCategoryName: string,
    settingKey: string
  ) {
    const moduleData = guildData.modules[moduleName] as any; // TODO ADD TYPE
    const currentValue = moduleData[subCategoryName]?.[settingKey] as boolean;
    const newValue = !currentValue;

    guildData = (await this.client.db.guilds.updateModuleSetting(
      interaction.guild?.id!,
      moduleName,
      subCategoryName,
      settingKey,
      newValue
    )) as IGuild;
    interaction.update({
      components: [
        SettingsUtils.createSettingsContainer(
          interaction,
          guildData,
          moduleName,
          subCategoryName
        ),
      ],
    });
  }

  //

  private async handleToggleModuleButton(interaction: ButtonInteraction) {
    const [, , selectedModule] = interaction.customId.split("-");
    const guildData = (await this.client.db.guilds.toggleModule(
      interaction.guild?.id!,
      selectedModule as keyof ModuleSettings
    )) as IGuild;
    interaction.update({
      components: [
        SettingsUtils.createSettingsContainer(interaction, guildData),
      ],
    });
  }

  //

  private async handleSelectMenuNav(interaction: AnySelectMenuInteraction) {
    const [, activeModule, activeSubcategory] =
      interaction.values[0].split("-");

    const guildData = await this.client.db.guilds.getOrCreate(
      interaction.guild?.id!
    );

    interaction.update({
      components: [
        SettingsUtils.createSettingsContainer(
          interaction,
          guildData,
          activeModule as keyof ModuleSettings,
          activeSubcategory
        ),
      ],
    });
  }

  //

  private checkIfMemberIsAdmin(
    interaction: ButtonInteraction | AnySelectMenuInteraction
  ) {
    if (
      interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return true;
    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "What are you even hoping for",
    });
    return false;
  }
}
