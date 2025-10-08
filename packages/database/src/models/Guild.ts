import { IGuild, LEVEL_MODULE_CONFIG, ModuleSettings } from "@shaw/types";
import mongoose, { Schema } from "mongoose";

function getDefaultValue(configOption: any): any {
  if (
    configOption &&
    typeof configOption === "object" &&
    "default" in configOption
  ) {
    return configOption.default;
  }
  return undefined;
}

function getMongooseType(configOption: any): any {
  if (!configOption || typeof configOption !== "object") {
    return mongoose.Schema.Types.Mixed;
  }

  switch (configOption.type) {
    case "boolean":
      return Boolean;
    case "number":
    case "time":
      return Number;
    case "string":
    case "text":
    case "select":
    case "channel":
    case "role":
    case "user":
      return String;
    case "array":
      return Array;
    case "object":
      return mongoose.Schema.Types.Mixed;
    default:
      return mongoose.Schema.Types.Mixed;
  }
}

function buildSchemaFromConfig(moduleConfig: any): any {
  const schema: any = {};

  for (const [categoryKey, categoryValue] of Object.entries(
    moduleConfig.categories
  )) {
    if (typeof categoryValue === "object" && categoryValue !== null) {
      schema[categoryKey] = {};

      for (const [settingKey, settingConfig] of Object.entries(
        (categoryValue as any).options || {}
      )) {
        if (
          typeof settingConfig === "object" &&
          settingConfig !== null &&
          "type" in settingConfig
        ) {
          schema[categoryKey][settingKey] = {
            type: getMongooseType(settingConfig),
            default: getDefaultValue(settingConfig),
          };
        }
      }
    }
  }
  return schema;
}

const GuildSchema = new Schema<IGuild>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    modules: {
      leveling: {
        enabled: {
          type: Boolean,
          default: false,
        },
        ...buildSchemaFromConfig(LEVEL_MODULE_CONFIG),
      },
    },
    disabledCommands: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const Guild =
  mongoose.models.Guild || mongoose.model<IGuild>("Guild", GuildSchema);
