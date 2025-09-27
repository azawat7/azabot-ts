import { BaseEvent, CustomBaseClient } from "@/base";
import { IGuild } from "@/database/models/Guild";
import {
  ALL_MODULE_CONFIGS,
  AllSettingKeys,
  ConfigOption,
  ModuleDataAccess,
  ModuleSettings,
  SubcategoryKeys,
} from "@/types";
import { SettingsUtils } from "@/utils/SettingsUtils";
import {
  ActionRowBuilder,
  AnySelectMenuInteraction,
  ButtonInteraction,
  Interaction,
  MessageFlags,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

type PossibleInteraction = ButtonInteraction | AnySelectMenuInteraction;

export default class SettingsInteractionHandlerEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "interactionCreate");
  }

  async run(interaction: Interaction): Promise<void> {
    if (!this.isSettingsInteraction(interaction)) return;
    if (!this.checkUserPermissions(interaction)) return;

    if (interaction.isButton()) {
      const [, buttonAction] = interaction.customId.split("-");

      switch (buttonAction) {
        case "homePage":
        case "config":
          await this.handleSettingsNavigation(interaction);
          break;
        case "toggle":
          await this.handleModuleToggle(interaction);
          break;
        case "change":
          await this.handleSettingChange(interaction);
          break;
      }
    } else if (interaction.isAnySelectMenu()) {
      const [, selectMenuAction] = interaction.customId.split("-");
      switch (selectMenuAction) {
        case "subcategorySelect":
          await this.handleSubCategoryNavigation(interaction);
          break;
      }
    }
  }

  // SETTINGS / MODULES

  private async handleSettingChange(interaction: ButtonInteraction) {
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
    const settingConfiguration = subcategoryConfiguration[
      settingKey
    ] as ConfigOption;

    console.log(settingConfiguration);
    const modal = new ModalBuilder()
      .setCustomId(interaction.customId)
      .setTitle(`Change the ${settingConfiguration.name}`);
    const actionRow = new ActionRowBuilder<TextInputBuilder>();

    switch (settingConfiguration.type) {
      case "boolean":
        await this.handleBooleanSettingChange(
          interaction,
          guildData,
          moduleName,
          subcategoryName,
          settingKey
        );
        break;
      case "select":
        break;
      case "text":
      case "number":
      case "time":
        break;
      case "array":
        break;
    }
  }

  private async handleModuleToggle(interaction: ButtonInteraction) {
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

  // NAV

  private async handleSettingsNavigation(interaction: ButtonInteraction) {
    const guildData = await this.client.db.guilds.getOrCreate(
      interaction.guild?.id!
    );
    const customIdParts = interaction.customId.split("-");
    let moduleName: keyof ModuleSettings | undefined = undefined;
    if (customIdParts[2]) moduleName = customIdParts[2] as keyof ModuleSettings;

    await interaction.update({
      components: [
        SettingsUtils.createSettingsContainer(
          interaction,
          guildData,
          moduleName
        ),
      ],
    });
  }

  private async handleSubCategoryNavigation(
    interaction: AnySelectMenuInteraction
  ) {
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

  // UTILS

  private isSettingsInteraction(
    interaction: Interaction
  ): interaction is PossibleInteraction {
    return (
      (interaction.isAnySelectMenu() || interaction.isButton()) &&
      interaction.customId.startsWith("settings")
    );
  }

  private checkUserPermissions(interaction: PossibleInteraction): boolean {
    if (
      interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return true;
    }

    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "What are you even hoping for",
    });
    return false;
  }

  // SETTING TYPE CHANGE HANDLING

  private async handleBooleanSettingChange(
    interaction: ButtonInteraction,
    guildData: IGuild,
    moduleName: keyof ModuleSettings,
    subcategoryName: string,
    settingKey: AllSettingKeys
  ) {
    const moduleData = guildData.modules[moduleName] as ModuleDataAccess<
      typeof moduleName
    >;
    const currentValue = (moduleData as any)[subcategoryName]?.[
      settingKey
    ] as boolean;
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
}
