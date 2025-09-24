import {
  AnySelectMenuInteraction,
  ButtonInteraction,
  Interaction,
  MessageFlags,
  PermissionsBitField,
} from "discord.js";
import { CustomBaseClient, BaseEvent } from "@/base";
import { IGuild } from "@/database/models/Guild";
import { SettingsUtils } from "@/utils/SettingsUtils";
import { ALL_MODULE_CONFIGS, AllSettingKeys, ConfigOption, ModuleDataAccess, ModuleSettings, SubcategoryKeys } from "@/types";

export default class SettingsInteractionCreateEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "interactionCreate");
  }
  async run(interaction: Interaction): Promise<void> {
    if (
      interaction.isAnySelectMenu() &&
      interaction.customId.startsWith("settings") &&
      this.checkIfUserIsAdmin(interaction)
    ) {
      await this.handleSelectMenuInteraction(interaction);
    }
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("settings") &&
      this.checkIfUserIsAdmin(interaction)
    ) {
      await this.handleButtonInteraction(interaction);
    }
  }

  private async handleButtonInteraction(interaction: ButtonInteraction) {
    const customIdParts = interaction.customId.split("-");
    const [, buttonAction] = customIdParts;
    if (buttonAction === "homePage" || buttonAction === "config") {
      const guildData = await this.client.db.guilds.getOrCreate(
        interaction.guild?.id!
      );

      let moduleName: keyof ModuleSettings | undefined = undefined;
      if (customIdParts[2]) moduleName = customIdParts[2] as keyof ModuleSettings;

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
    if (buttonAction === "toggle") {
      this.handleToggleModuleButton(interaction);
    }
    if (buttonAction === "change") {
      this.handleSettingChangeButton(interaction);
    }
  }

  private async handleSelectMenuInteraction(
    interaction: AnySelectMenuInteraction
  ) {
    const [, selectMenuAction] = interaction.customId.split("-");
    if (selectMenuAction === "subcategorySelect") {
      await this.handleSelectMenuNavigation(interaction);
    }
  }

  //

  private async handleSettingChangeButton(interaction: ButtonInteraction) {
    const [, , moduleName, subcategoryName, settingKey] =
      interaction.customId.split("-") as [
        unknown,
        unknown,
        keyof ModuleSettings,
        string,
        AllSettingKeys
      ];
    const guildData = await this.client.db.guilds.getOrCreate(
      interaction.guild?.id!
    );

    const moduleConfiguration = ALL_MODULE_CONFIGS[moduleName];
    const subcategoryConfiguration = moduleConfiguration[subcategoryName];
    const settingConfiguration = subcategoryConfiguration[settingKey] as ConfigOption;

    switch (settingConfiguration.type) {
      case "boolean":
        await this.handleBooleanSetting(
          interaction,
          guildData,
          moduleName,
          subcategoryName,
          settingKey
        );
        break;

      // case "select":
      //   await this.handleSelectSetting(
      //     interaction,
      //     guildData,
      //     moduleName,
      //     subcategoryName,
      //     settingKey,
      //     settingConfiguration
      //   );
      //   break;

      // case "text":
      // case "number":
      // case "time":
      //   await this.handleInputSetting(
      //     interaction,
      //     moduleName,
      //     subcategoryName,
      //     settingKey,
      //     settingConfiguration,
      //     currentValue
      //   );
      //   break;

      // case "array":
      //   await this.handleArraySetting(
      //     interaction,
      //     guildData,
      //     moduleName,
      //     subcategoryName,
      //     settingKey,
      //     settingConfiguration
      //   );
      // break;
    }
  }

  //

  private async handleBooleanSetting(
    interaction: ButtonInteraction,
    guildData: IGuild,
    moduleName: keyof ModuleSettings,
    subcategoryName: string,
    settingKey: AllSettingKeys
  ) {
    const moduleData = guildData.modules[moduleName] as ModuleDataAccess<typeof moduleName>;
    const currentValue = (moduleData as any)[subcategoryName]?.[settingKey] as boolean;
    const newValue = !currentValue;

    guildData = (await this.client.db.guilds.updateModuleSetting(
      interaction.guild?.id!,
      moduleName,
      subcategoryName as SubcategoryKeys<typeof moduleName>,
      settingKey,
      newValue
    )) as IGuild;
    interaction.update({
      components: [
        SettingsUtils.createSettingsContainer(
          interaction,
          guildData,
          moduleName,
          subcategoryName
        ),
      ],
    });
  }

  //

  private async handleToggleModuleButton(interaction: ButtonInteraction) {
    const [, , targetModule] = interaction.customId.split("-");
    const guildData = (await this.client.db.guilds.toggleModule(
      interaction.guild?.id!,
      targetModule as keyof ModuleSettings
    )) as IGuild;
    interaction.update({
      components: [
        SettingsUtils.createSettingsContainer(interaction, guildData),
      ],
    });
  }

  //

  private async handleSelectMenuNavigation(interaction: AnySelectMenuInteraction) {
    const [, selectedModule, selectedSubcategory] =
      interaction.values[0].split("-");

    const guildData = await this.client.db.guilds.getOrCreate(
      interaction.guild?.id!
    );

    interaction.update({
      components: [
        SettingsUtils.createSettingsContainer(
          interaction,
          guildData,
          selectedModule as keyof ModuleSettings,
          selectedSubcategory
        ),
      ],
    });
  }

  //

  private checkIfUserIsAdmin(
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