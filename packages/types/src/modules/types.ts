import { ModuleConfig, ConfigCategory } from "../config/types";

export function createModuleConfig<T extends ModuleConfig>(config: T): T {
  return config;
}

export function createConfigCategory<T extends ConfigCategory>(category: T): T {
  return category;
}
