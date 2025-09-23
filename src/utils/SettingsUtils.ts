import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  Interaction,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { IGuild, IGuildModules } from "db/models/Guild";
import {
  ALL_MODULE_CONFIGS,
  MODULE_METADATA,
  ModuleSettings,
  ConfigOption,
  ModuleConfigCategory,
} from "@/types/settings.types";

export class SettingsUtils {
  static createSettingsContainer(
    interaction: Interaction,
    guildData: IGuild,
    activeModule?: keyof ModuleSettings,
    activeSubcategory?: string
  ) {
    const moduleSettings: IGuildModules = guildData.toObject().modules;
    const container = new ContainerBuilder();

    // HEADER
    SettingsUtils.addTextDisplayComponent(
      container,
      `## ${interaction.guild!.name}'s settings`
    );
    SettingsUtils.addSeparatorComponent(container, SeparatorSpacingSize.Large);

    // MAIN CONTENT
    if (activeModule) {
      if (!activeSubcategory) {
        const moduleMetadata = MODULE_METADATA[activeModule];
        activeSubcategory = moduleMetadata.categories[0];
      }
      SettingsUtils.createSubcategoryConfigurationPage(
        container,
        moduleSettings,
        activeModule,
        activeSubcategory
      );
    } else {
      SettingsUtils.createModuleOverviewPage(container, moduleSettings);
    }

    return container;
  }

  static createModuleOverviewPage(
    container: ContainerBuilder,
    moduleSettings: IGuildModules
  ) {
    for (const moduleName of Object.keys(
      moduleSettings
    ) as (keyof ModuleSettings)[]) {
      const moduleMetadata = MODULE_METADATA[moduleName];
      const moduleData = moduleSettings[moduleName];

      SettingsUtils.addTextDisplayComponent(
        container,
        `### ${moduleMetadata.emoji}   ${moduleMetadata.name}\n> -# ${moduleMetadata.description}`
      );

      const statusButton = new ButtonBuilder()
        .setCustomId(`settings-${moduleName}`)
        .setLabel(moduleData.enabled ? "Enabled" : "Disabled")
        .setStyle(
          moduleData.enabled ? ButtonStyle.Success : ButtonStyle.Danger
        )
        .setDisabled();

      const toggleButton = new ButtonBuilder()
        .setCustomId(`settings-toggle-${moduleName}`)
        .setLabel(moduleData.enabled ? "Toggle Off" : "Toggle On")
        .setStyle(ButtonStyle.Secondary);

      const configureButton = new ButtonBuilder()
        .setCustomId(`settings-config-${moduleName}`)
        .setLabel("Configure")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!moduleData.enabled);

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

  static createSubcategoryConfigurationPage(
    container: ContainerBuilder,
    moduleSettings: IGuildModules,
    activeModule: keyof ModuleSettings,
    activeSubcategory: string
  ) {
    const moduleMetadata = MODULE_METADATA[activeModule];
    const moduleConfiguration = ALL_MODULE_CONFIGS[activeModule];
    const subcategoryConfiguration = moduleConfiguration[
      activeSubcategory
    ] as ModuleConfigCategory;
    const currentSubcategoryValues =
      moduleSettings[activeModule][
        activeSubcategory as keyof (typeof moduleSettings)[typeof activeModule]
      ];

    // Get all subcategories for the select menu
    const subcategories = moduleMetadata.categories;

    // Subcategory header with select menu
    SettingsUtils.addTextDisplayComponent(
      container,
      `### ${moduleMetadata.emoji}   ${moduleMetadata.name} Configuration`
    );

    const selectMenuOptions = subcategories.map((subcategory) => {
      const subcategoryConfig = moduleConfiguration[subcategory] as ModuleConfigCategory;

      return new StringSelectMenuOptionBuilder()
        .setLabel(subcategoryConfig.name)
        .setValue(`settings-${activeModule}-${subcategory}`)
        .setDescription(subcategoryConfig.description)
        .setDefault(subcategory === activeSubcategory);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`settings-subcategorySelect-${activeModule}`)
      .addOptions(selectMenuOptions);

    SettingsUtils.addSelectMenu(container, selectMenu);
    SettingsUtils.addSeparatorComponent(container, SeparatorSpacingSize.Large);

    // Display individual settings
    if (typeof currentSubcategoryValues === "object" && currentSubcategoryValues !== null) {
      for (const [settingKey, settingValue] of Object.entries(currentSubcategoryValues)) {
        const settingConfiguration = subcategoryConfiguration[settingKey] as ConfigOption;

        if (
          settingConfiguration &&
          typeof settingConfiguration === "object" &&
          settingConfiguration.name
        ) {
          const displayValue = SettingsUtils.formatSettingValue(
            settingValue,
            settingConfiguration
          );

          const changeButton = new ButtonBuilder()
            .setCustomId(
              `settings-change-${activeModule}-${activeSubcategory}-${settingKey}`
            )
            .setLabel("Change")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(settingConfiguration.readonly === true);

          container.addSectionComponents((section) =>
            section
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(
                  `**${
                    settingConfiguration.name
                  }**\n> -# ${SettingsUtils.formatDescription(
                    settingConfiguration.description
                  )}\nCurrent: **${displayValue}**`
                )
              )
              .setButtonAccessory(changeButton)
          );
          SettingsUtils.addSeparatorComponent(
            container,
            SeparatorSpacingSize.Small
          );
        }
      }
    }

    const homeButton = new ButtonBuilder()
      .setCustomId(`settings-homePage`)
      .setLabel("🏠 Back to Overview")
      .setStyle(ButtonStyle.Secondary);

    SettingsUtils.addButtonRow(container, [homeButton]);
    return container;
  }

  private static formatDescription(description: string): string {
    if (!description || description.length <= 60) {
      return description;
    }

    const maxFirstLine = 60;
    let breakPoint = maxFirstLine;

    for (let i = maxFirstLine; i >= maxFirstLine - 10 && i >= 0; i--) {
      if (description[i] === " ") {
        breakPoint = i;
        break;
      }
    }

    if (breakPoint === maxFirstLine && description[maxFirstLine] !== " ") {
      breakPoint = maxFirstLine;
    }

    const firstLine = description.substring(0, breakPoint);
    const secondLine = description.substring(breakPoint).trim();

    return `${firstLine}\n> -# ${secondLine}`;
  }

  private static formatSettingValue(
    value: any,
    settingConfiguration: ConfigOption
  ): string {
    switch (settingConfiguration.type) {
      case "boolean":
        return value ? "✅ Enabled" : "❌ Disabled";

      case "time": {
        const unit = settingConfiguration.unit || "seconds";
        return `${value} ${unit}`;
      }

      case "number": {
        const unit = settingConfiguration.unit ? ` ${settingConfiguration.unit}` : "";
        return `${value}${unit}`;
      }

      case "array":
        return `${Array.isArray(value) ? value.length : 0} items`;

      case "select":
        return String(value);

      case "text":
        if (typeof value === "string" && value === "") {
          return "Not set";
        }
        return String(value);

      case "tuple":
        if (Array.isArray(value)) {
          return `[${value.join(", ")}]`;
        }
        return "Not configured";

      default:
        if (typeof value === "string" && value === "") {
          return "Not set";
        }
        return String(value);
    }
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

  static addSelectMenu(
    container: ContainerBuilder,
    selectMenu: StringSelectMenuBuilder
  ) {
    return container.addActionRowComponents((actionRow) =>
      actionRow.addComponents(selectMenu)
    );
  }
}