import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  Interaction,
  SeparatorSpacingSize,
} from "discord.js";
import { IGuild, IGuildModules } from "db/models/Guild";
import { ModulesConfigs } from "@/types/settings.types";

export const moduleDescriptions = {
  levelModule: {
    name: "Leveling",
    emoji: "🧮",
    description: "Fully customizable leveling system.",
  },
};

export class SettingsUtils {
  static createSettingsContainer(
    interaction: Interaction,
    guildData: IGuild,
    activeModule?: keyof IGuildModules
  ) {
    const moduleConfigs: IGuildModules = guildData.toObject().modules;
    const container = new ContainerBuilder();
    // HEADER
    SettingsUtils.addTextDisplayComponent(
      container,
      `## ${interaction.guild!.name}'s settings`
    );
    SettingsUtils.addSeparatorComponent(container, SeparatorSpacingSize.Large);

    // MAIN CONTENT
    if (activeModule) {
      SettingsUtils.createModuleConfigPage(
        container,
        moduleConfigs,
        activeModule
      );
    } else {
      SettingsUtils.createModuleOverviewPage(container, moduleConfigs);
    }

    return container;
  }

  static createModuleOverviewPage(
    container: ContainerBuilder,
    moduleConfigs: IGuildModules
  ) {
    for (const moduleName of Object.keys(
      moduleConfigs
    ) as (keyof IGuildModules)[]) {
      const moduleDescription = moduleDescriptions[moduleName];
      const moduleConfig = moduleConfigs[moduleName];
      SettingsUtils.addTextDisplayComponent(
        container,
        `### ${moduleDescription.emoji}   ${moduleDescription.name}\n> -# ${moduleDescription.description}`
      );

      const statusButton = new ButtonBuilder()
        .setCustomId(`settings-${moduleName}`)
        .setLabel(moduleConfig.enabled ? "Enabled" : "Disabled")
        .setStyle(
          moduleConfig.enabled ? ButtonStyle.Success : ButtonStyle.Danger
        )
        .setDisabled();
      const toggleButton = new ButtonBuilder()
        .setCustomId(`settings-${moduleName}-toggle`)
        .setLabel(moduleConfig.enabled ? "Toggle Off" : "Toggle On")
        .setStyle(ButtonStyle.Secondary);
      const configureButton = new ButtonBuilder()
        .setCustomId(`settings-${moduleName}-config`)
        .setLabel("Configure")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(moduleConfig.enabled ? false : true);
      SettingsUtils.addButtonRow(container, [
        statusButton,
        toggleButton,
        configureButton,
      ]);
      SettingsUtils.addSeparatorComponent(
        container,
        SeparatorSpacingSize.Large
      );
    }

    return container;
  }

  static createModuleConfigPage(
    container: ContainerBuilder,
    moduleConfigs: IGuildModules,
    activeModule: keyof IGuildModules
  ) {
    const moduleConfig = moduleConfigs[activeModule];

    for (const [settingKey, settingValue] of Object.entries(moduleConfig)) {
      if (settingKey === "enabled") continue;

      const settingMetadata =
        ModulesConfigs[activeModule][
          settingKey as keyof (typeof ModulesConfigs)[typeof activeModule]
        ];

      // container.addSectionComponents((section) =>
      //   section
      //     .addTextDisplayComponents((textDisplay) =>
      //       textDisplay.setContent(
      //         `**${settingMetadata.name}**\n> -# ${settingMetadata.description}\nCurrent: **${settingValue}**`
      //       )
      //     )
      //     .setButtonAccessory((button) =>
      //       button
      //         .setCustomId(`settings-${settingKey}`)
      //         .setLabel("Change")
      //         .setStyle(ButtonStyle.Primary)
      //     )
      // );
    }

    SettingsUtils.addSeparatorComponent(container, SeparatorSpacingSize.Large);
    const homePageButton = new ButtonBuilder()
      .setCustomId(`settings-homePage`)
      .setLabel("Home Page")
      .setStyle(ButtonStyle.Primary);
    const saveButton = new ButtonBuilder()
      .setCustomId(`settings-save`)
      .setLabel("Save")
      .setStyle(ButtonStyle.Success);
    const discardButton = new ButtonBuilder()
      .setCustomId(`settings-discard`)
      .setLabel("Discard")
      .setStyle(ButtonStyle.Danger);
    const reviewButton = new ButtonBuilder()
      .setCustomId(`settings-review`)
      .setLabel("Review Changes")
      .setStyle(ButtonStyle.Secondary);
    SettingsUtils.addButtonRow(container, [
      homePageButton,
      saveButton,
      discardButton,
      reviewButton,
    ]);
    return container;
  }

  // CONTAINER UTILS
  static addTextDisplayComponent(container: ContainerBuilder, content: string) {
    return container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(content)
    );
  }
  static addSeparatorComponent(
    container: ContainerBuilder,
    spacing: SeparatorSpacingSize
  ) {
    return container.addSeparatorComponents((separator) =>
      separator.setSpacing(spacing)
    );
  }

  static addButtonRow(container: ContainerBuilder, buttons: any) {
    return container.addActionRowComponents((actionRow) =>
      actionRow.addComponents(buttons)
    );
  }
}
