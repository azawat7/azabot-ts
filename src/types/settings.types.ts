import { LevelFormula } from "@/utils/LevelUtils";
import { Snowflake } from "discord.js";

export interface BaseConfigOption {
  name: string;
  description: string;
  readonly?: boolean;
}

export interface BooleanConfigOption extends BaseConfigOption {
  type: "boolean";
  default: boolean;
}

export interface SelectConfigOption<T extends string> extends BaseConfigOption {
  type: "select";
  options: readonly T[];
  default: T;
}

export interface NumberConfigOption extends BaseConfigOption {
  type: "number";
  min?: number;
  max?: number;
  default: number;
  unit?: string;
}

export interface TextConfigOption extends BaseConfigOption {
  type: "text";
  maxLength?: number;
  placeholder?: string;
  default: string;
}

export interface TimeConfigOption extends BaseConfigOption {
  type: "time";
  unit: "seconds" | "minutes" | "hours";
  min?: number;
  max?: number;
  default: number;
}

export interface ArrayConfigOption<T> extends BaseConfigOption {
  type: "array";
  itemType: T;
  maxItems?: number;
  default: any[];
}

export interface TupleConfigOption extends BaseConfigOption {
  type: "tuple";
  schema: [NumberConfigOption, TextConfigOption];
}

export type ConfigOption =
  | BooleanConfigOption
  | SelectConfigOption<any>
  | NumberConfigOption
  | TextConfigOption
  | TimeConfigOption
  | ArrayConfigOption<any>
  | TupleConfigOption;

export interface LevelModuleSettings {
  enabled: boolean;
  messageXp: {
    messageXpFormula: LevelFormula;
    messageXpMin: number;
    messageXpMax: number;
    messageXpCooldown: number;
  };
  lvlUpMsg: {
    lvlUpMsgChannel: Snowflake;
    lvlUpMsgChannelType: "disabled" | "current" | "pm" | "custom";
    lvlUpMsgContent: string;
  };
  roleRewards: {
    roleRewardsStack: boolean;
    roleRewardsArray: [number, Snowflake][];
  };
}

export interface ModuleSettings {
  levelModule: LevelModuleSettings;
}

export interface ModuleConfigCategory {
  name: string;
  description: string;
  [settingKey: string]: ConfigOption | string;
}

export interface ModuleConfiguration {
  [categoryKey: string]: ModuleConfigCategory;
}

export const LEVEL_MODULE_CONFIG: ModuleConfiguration = {
  messageXp: {
    name: "Message XP Settings",
    description: "Configure how users earn XP from sending messages",

    messageXpFormula: {
      name: "XP Calculation Formula",
      type: "select",
      options: ["linear", "exponential", "logarithmic", "custom"] as const,
      default: "linear",
      description: "Formula used to calculate XP required for each level",
    } as SelectConfigOption<LevelFormula>,

    messageXpMin: {
      name: "Minimum XP per Message",
      type: "number",
      min: 1,
      max: 100,
      default: 15,
      unit: "XP",
      description: "Minimum amount of XP awarded for each message",
    } as NumberConfigOption,

    messageXpMax: {
      name: "Maximum XP per Message",
      type: "number",
      min: 1,
      max: 500,
      default: 25,
      unit: "XP",
      description: "Maximum amount of XP awarded for each message",
    } as NumberConfigOption,

    messageXpCooldown: {
      name: "XP Gain Cooldown",
      type: "time",
      unit: "seconds",
      min: 10,
      max: 300,
      default: 60,
      description: "Time users must wait between XP gains to prevent spam",
    } as TimeConfigOption,
  },

  lvlUpMsg: {
    name: "Level Up Notifications",
    description: "Configure where and how level up messages are sent",

    lvlUpMsgChannelType: {
      name: "Notification Location",
      type: "select",
      options: ["disabled", "current", "pm", "custom"] as const,
      default: "current",
      description: "Where to send level-up notifications",
    } as SelectConfigOption<"disabled" | "current" | "pm" | "custom">,

    lvlUpMsgChannel: {
      name: "Custom Channel ID",
      type: "text",
      maxLength: 20,
      placeholder: "123456789012345678",
      default: "",
      description:
        "Discord channel ID for custom level-up messages (only used when 'custom' is selected)",
    } as TextConfigOption,

    lvlUpMsgContent: {
      name: "Level Up Message Template",
      type: "text",
      maxLength: 2000,
      placeholder: "🎉 {user} reached level {level}!",
      default: "🎉 Congratulations {user}! You've reached **Level {level}**!",
      description:
        "Message template for level-up notifications. Use {user} for mention and {level} for level number",
    } as TextConfigOption,
  },

  roleRewards: {
    name: "Role Rewards System",
    description: "Automatically assign roles when users reach specific levels",

    roleRewardsStack: {
      name: "Stack Role Rewards",
      type: "boolean",
      default: false,
      description:
        "Allow users to keep previous level roles when earning new ones",
    } as BooleanConfigOption,

    roleRewardsArray: {
      name: "Level Role Assignments",
      type: "array",
      itemType: {
        name: "Level-Role Pair",
        type: "tuple",
        schema: [
          {
            name: "Required Level",
            type: "number",
            min: 1,
            max: 1000,
            default: 1,
            description: "Level requirement",
          } as NumberConfigOption,
          {
            name: "Role ID",
            type: "text",
            maxLength: 20,
            placeholder: "123456789012345678",
            default: "",
            description: "Discord role ID to assign",
          } as TextConfigOption,
        ],
        description: "Level requirement and corresponding role to assign",
      } as TupleConfigOption,
      maxItems: 25,
      default: [],
      description:
        "List of level milestones and their corresponding role rewards",
    } as ArrayConfigOption<TupleConfigOption>,
  },
} as const;

export interface ModuleMetadata {
  name: string;
  emoji: string;
  description: string;
  categories: string[];
}

export const MODULE_METADATA: Record<keyof ModuleSettings, ModuleMetadata> = {
  levelModule: {
    name: "Leveling System",
    emoji: "📈",
    description:
      "A comprehensive leveling system with XP, role rewards, and customizable progression",
    categories: ["messageXp", "lvlUpMsg", "roleRewards"],
  },
};

// All module configurations
export const ALL_MODULE_CONFIGS: Record<
  keyof ModuleSettings,
  ModuleConfiguration
> = {
  levelModule: LEVEL_MODULE_CONFIG,
};
