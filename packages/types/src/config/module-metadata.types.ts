import { ModuleSettings } from "../modules/module-settings.types";
import { ModuleConfiguration } from "./base-config.types";
import { LEVEL_MODULE_CONFIG } from "./level-config";

export interface ModuleMetadata {
  name: string;
  emoji: string;
  reactIconName: string;
  description: string;
  categories: string[];
}

export const MODULE_METADATA: Record<keyof ModuleSettings, ModuleMetadata> = {
  levelModule: {
    name: "Leveling",
    emoji: "📊",
    reactIconName: "HiSparkles",
    description:
      "A leveling system with XP, role rewards, and customizable progression",
    categories: ["messageXp", "lvlUpMsg", "roleRewards"],
  },
};

export const ALL_MODULE_CONFIGS: Record<
  keyof ModuleSettings,
  ModuleConfiguration
> = {
  levelModule: LEVEL_MODULE_CONFIG,
};
