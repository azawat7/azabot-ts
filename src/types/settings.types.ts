import { LevelFormula } from "@/utils/LevelUtils";
import { Snowflake } from "discord.js";

export type BooleanConfig = {
  type: "boolean";
  default: boolean;
  description: string;
};

export type SelectConfig<T extends string> = {
  type: "select";
  options: readonly T[];
  default: T;
  description: string;
};

export type NumberConfig = {
  type: "number";
  min?: number;
  max?: number;
  default: number;
  description: string;
};

export type TextConfig = {
  type: "text";
  maxLength?: number;
  placeholder?: string;
  default: string;
  description: string;
};

export type TimeConfig = {
  type: "time";
  unit: "seconds" | "minutes" | "hours";
  min?: number;
  max?: number;
  default: number;
  description: string;
};

export type ArrayConfig<T> = {
  type: "array";
  itemType: T;
  maxItems?: number;
  default: any[];
  description: string;
};

type TupleConfig = {
  type: "tuple";
  schema: [NumberConfig, TextConfig];
  description: string;
};

export interface ILevelModule {
  enabled: boolean;
  messageXpFormula: LevelFormula;
  messageXpMin: number;
  messageXpMax: number;
  messageXpCooldown: number;
  lvlUpMsgChannel: Snowflake;
  lvlUpMsgChannelType: "disabled" | "current" | "pm" | "custom";
  lvlUpMsgContent: string;
  roleRewardsStack: boolean;
  roleRewardsArray: [number, Snowflake][];
}

export const LevelModuleConfig = {
  messageXpFormula: {
    name: "XP Formula",
    type: "select",
    options: ["linear", "exponential", "logarithmic", "custom"],
    default: "linear",
    description: "Formula used to calculate XP required for each level",
  } as SelectConfig<LevelFormula>,

  messageXpMin: {
    type: "number",
    min: 1,
    max: 100,
    default: 15,
    description: "Minimum XP gained per message",
  } as NumberConfig,

  messageXpMax: {
    type: "number",
    min: 1,
    max: 500,
    default: 25,
    description: "Maximum XP gained per message",
  } as NumberConfig,

  messageXpCooldown: {
    type: "time",
    unit: "seconds",
    min: 10,
    max: 60,
    default: 60,
    description: "Cooldown between XP gains (in seconds)",
  } as TimeConfig,

  lvlUpMsgChannel: {
    type: "text",
    maxLength: 20,
    placeholder: "Enter channel ID",
    default: "",
    description: "Channel ID for level-up messages",
  } as TextConfig,

  lvlUpMsgChannelType: {
    type: "select",
    options: ["disabled", "current", "pm", "custom"],
    default: "current",
    description: "Where to send level-up messages",
  } as SelectConfig<"disabled" | "current" | "pm" | "custom">,

  lvlUpMsgContent: {
    type: "text",
    maxLength: 2000,
    placeholder: "Congratulations {user}, you reached level {level}!",
    default: "🎉 Congratulations {user}! You've reached **Level {level}**!",
    description:
      "Message content for level-up notifications. Use {user} and {level} as placeholders.",
  } as TextConfig,

  roleRewardsStack: {
    type: "boolean",
    default: false,
    description:
      "Whether users keep previous level roles when gaining new ones",
  } as BooleanConfig,

  roleRewardsArray: {
    type: "array",
    itemType: {
      type: "tuple",
      schema: [
        {
          type: "number",
          min: 1,
          max: 1000,
          default: 1,
          description: "Required level",
        } as NumberConfig,
        {
          type: "text",
          maxLength: 20,
          placeholder: "Role ID",
          default: "",
          description: "Role ID to assign",
        } as TextConfig,
      ],
      description: "Level and role ID pair",
    } as TupleConfig,
    maxItems: 20,
    default: [],
    description: "Array of [level, roleId] pairs for role rewards",
  } as ArrayConfig<TupleConfig>,
} as const;

export const ModulesConfigs = {
  levelModule: LevelModuleConfig,
};
