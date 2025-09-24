import { LevelFormula } from "@/utils/LevelUtils";
import { Snowflake } from "discord.js";

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

export type LevelModuleSettingKeys = 
  | keyof LevelModuleSettings['messageXp']
  | keyof LevelModuleSettings['lvlUpMsg'] 
  | keyof LevelModuleSettings['roleRewards'];

export type LevelModuleSubcategories = keyof Omit<LevelModuleSettings, 'enabled'>;