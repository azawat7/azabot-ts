export interface BaseConfigOption {
  name: string;
  description: string;
  readonly?: boolean;
  required?: boolean;
  help?: string;
  visible?: boolean;
  dependencies?: ConfigDependency[];
  crossFieldValidation?: CrossFieldValidation[];
}

export interface ConfigDependency {
  field: string;
  condition: DependencyCondition;
}

export interface CrossFieldValidation {
  field: string;
  condition: DependencyCondition;
  errorMessage: string;
}

export type DependencyCondition =
  | { type: "equals"; value: any }
  | { type: "notEquals"; value: any }
  | { type: "in"; values: any[] }
  | { type: "notIn"; values: any[] }
  | { type: "truthy" }
  | { type: "falsy" }
  | { type: "custom"; validator: (value: any) => boolean }
  | {
      type: "customCrossField";
      validator: (referencedValue: any, currentValue: any) => boolean;
    };

export interface BooleanConfigOption extends BaseConfigOption {
  type: "boolean";
  default: boolean;
}

export interface NumberConfigOption extends BaseConfigOption {
  type: "number";
  default: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface StringConfigOption extends BaseConfigOption {
  type: "string";
  default: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
}

export interface SelectConfigOption<T extends string = string>
  extends BaseConfigOption {
  type: "select";
  options: readonly T[];
  default: T;
  allowCustom?: boolean;
}

export interface MultiSelectConfigOption<T extends string = string>
  extends BaseConfigOption {
  type: "multiselect";
  options: readonly T[];
  default: T[];
  minSelections?: number;
  maxSelections?: number;
}

export interface TimeConfigOption extends BaseConfigOption {
  type: "time";
  default: number;
  min?: number;
  max?: number;
  unit: "seconds" | "minutes" | "hours" | "days";
}

export interface ArrayConfigOption<T = any> extends BaseConfigOption {
  type: "array";
  itemType: ConfigOption;
  default: T[];
  minItems?: number;
  maxItems?: number;
}

export interface ObjectConfigOption extends BaseConfigOption {
  type: "object";
  schema: Record<string, ConfigOption>;
  default: Record<string, any>;
}

export interface ChannelConfigOption extends BaseConfigOption {
  type: "channel";
  default: string | null;
  channelTypes?: ("text" | "voice" | "category" | "news" | "thread")[];
  allowNone?: boolean;
}

export interface RoleConfigOption extends BaseConfigOption {
  type: "role";
  default: string | null;
  allowNone?: boolean;
  allowEveryone?: boolean;
}

export interface UserConfigOption extends BaseConfigOption {
  type: "user";
  default: string | null;
  allowNone?: boolean;
}

export type ConfigOption =
  | BooleanConfigOption
  | NumberConfigOption
  | StringConfigOption
  | SelectConfigOption<any>
  | MultiSelectConfigOption<any>
  | TimeConfigOption
  | ArrayConfigOption<any>
  | ObjectConfigOption
  | ChannelConfigOption
  | RoleConfigOption
  | UserConfigOption;

export type ConfigValue<T extends ConfigOption> = T extends BooleanConfigOption
  ? boolean
  : T extends NumberConfigOption
  ? number
  : T extends StringConfigOption
  ? string
  : T extends SelectConfigOption<infer U>
  ? U
  : T extends MultiSelectConfigOption<infer U>
  ? U[]
  : T extends TimeConfigOption
  ? number
  : T extends ArrayConfigOption<infer U>
  ? U[]
  : T extends ObjectConfigOption
  ? Record<string, any>
  : T extends ChannelConfigOption
  ? string | null
  : T extends RoleConfigOption
  ? string | null
  : T extends UserConfigOption
  ? string | null
  : never;

export interface ConfigCategory {
  name: string;
  description: string;
  reactIconName: string;
  order?: number;
  options: Record<string, ConfigOption>;
}

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  reactIconName?: string;
  enabledByDefault?: boolean;
  categories: Record<string, ConfigCategory>;
}

export type ModuleSettings<T extends ModuleConfig = ModuleConfig> = {
  enabled: boolean;
} & {
  [K in keyof T["categories"]]: {
    [P in keyof T["categories"][K]["options"]]: ConfigValue<
      T["categories"][K]["options"][P]
    >;
  };
};

export function checkDependency(
  dependency: ConfigDependency,
  settings: Record<string, any>
): boolean {
  const value = getNestedValue(settings, dependency.field);

  switch (dependency.condition.type) {
    case "equals":
      return value === dependency.condition.value;
    case "notEquals":
      return value !== dependency.condition.value;
    case "in":
      return dependency.condition.values.includes(value);
    case "notIn":
      return !dependency.condition.values.includes(value);
    case "truthy":
      return Boolean(value);
    case "falsy":
      return !Boolean(value);
    case "custom":
      return dependency.condition.validator(value);
    case "customCrossField":
      throw new Error(
        "customCrossField condition type should only be used in cross-field validation"
      );
    default:
      return true;
  }
}

export function checkCrossFieldValidation(
  validation: CrossFieldValidation,
  settings: Record<string, any>,
  currentValue?: any
): { isValid: boolean; errorMessage?: string } {
  const referencedValue = getNestedValue(settings, validation.field);

  if (validation.condition.type === "customCrossField") {
    const isValid = validation.condition.validator(
      referencedValue,
      currentValue
    );
    return {
      isValid,
      errorMessage: isValid ? undefined : validation.errorMessage,
    };
  }

  const isValid = checkDependency(
    { field: validation.field, condition: validation.condition },
    settings
  );

  return {
    isValid,
    errorMessage: isValid ? undefined : validation.errorMessage,
  };
}

export function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

export function createDependency(
  field: string,
  condition: DependencyCondition
): ConfigDependency {
  return { field, condition };
}

export const DependencyConditions = {
  equals: (value: any) => ({ type: "equals" as const, value }),
  notEquals: (value: any) => ({ type: "notEquals" as const, value }),
  in: (values: any[]) => ({ type: "in" as const, values }),
  notIn: (values: any[]) => ({ type: "notIn" as const, values }),
  truthy: () => ({ type: "truthy" as const }),
  falsy: () => ({ type: "falsy" as const }),
  custom: (validator: (value: any) => boolean) => ({
    type: "custom" as const,
    validator,
  }),
  customCrossField: (
    validator: (referencedValue: any, currentValue: any) => boolean
  ) => ({
    type: "customCrossField" as const,
    validator,
  }),
};
