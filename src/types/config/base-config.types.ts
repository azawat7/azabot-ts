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

export interface ModuleConfigCategory {
  name: string;
  description: string;
  [settingKey: string]: ConfigOption | string;
}

export interface ModuleConfiguration {
  [categoryKey: string]: ModuleConfigCategory;
}