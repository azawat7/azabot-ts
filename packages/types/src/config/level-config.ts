import { LevelFormula } from "../modules/level-module.types";
import {
  ModuleConfiguration,
  SelectConfigOption,
  NumberConfigOption,
  TimeConfigOption,
  TextConfigOption,
  BooleanConfigOption,
  ArrayConfigOption,
  TupleConfigOption,
} from "./base-config.types";

export const LEVEL_MODULE_CONFIG: ModuleConfiguration = {
  messageXp: {
    name: "Message XP Settings",
    description: "Configure how users earn XP from sending messages",

    messageXpFormula: {
      name: "XP Calculation Formula",
      type: "select",
      options: ["classic", "exponential", "flat"] as const,
      default: "classic",
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
