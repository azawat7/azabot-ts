import { LevelModuleSettings } from "./level-module.types";

export interface ModuleSettings {
  levelModule: LevelModuleSettings;
}

// Type helper to access module data with proper typing
export type ModuleDataAccess<T extends keyof ModuleSettings> = {
  [K in keyof ModuleSettings[T]]: ModuleSettings[T][K] extends object
    ? ModuleSettings[T][K]
    : ModuleSettings[T][K];
};

// Type helper to get subcategory keys for a specific module
export type SubcategoryKeys<T extends keyof ModuleSettings> =
  keyof ModuleSettings[T];
