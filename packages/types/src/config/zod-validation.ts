import { z } from "zod";
import {
  ConfigOption,
  ModuleConfig,
  ConfigCategory,
  NumberConfigOption,
  StringConfigOption,
  SelectConfigOption,
  MultiSelectConfigOption,
  TimeConfigOption,
  ArrayConfigOption,
  ObjectConfigOption,
  ChannelConfigOption,
  RoleConfigOption,
  UserConfigOption,
  ModuleSettings,
  checkCrossFieldValidation,
} from "./types";

function generateZodSchema(option: ConfigOption): z.ZodTypeAny {
  switch (option.type) {
    case "boolean":
      return z.boolean();

    case "number":
      const numOption = option as NumberConfigOption;
      let numSchema = z.number();

      if (numOption.min !== undefined) {
        numSchema = numSchema.min(numOption.min);
      }
      if (numOption.max !== undefined) {
        numSchema = numSchema.max(numOption.max);
      }

      return numSchema;

    case "string":
      const strOption = option as StringConfigOption;
      let strSchema = z.string();

      if (strOption.minLength !== undefined) {
        strSchema = strSchema.min(strOption.minLength);
      }
      if (strOption.maxLength !== undefined) {
        strSchema = strSchema.max(strOption.maxLength);
      }
      if (strOption.pattern) {
        strSchema = strSchema.regex(new RegExp(strOption.pattern));
      }

      return strSchema;

    case "select":
      const selectOption = option as SelectConfigOption;
      return z.enum(selectOption.options as [string, ...string[]]);

    case "multiselect":
      const multiSelectOption = option as MultiSelectConfigOption;
      const enumSchema = z.enum(
        multiSelectOption.options as [string, ...string[]]
      );
      let multiSelectSchema = z.array(enumSchema);

      if (multiSelectOption.minSelections !== undefined) {
        multiSelectSchema = multiSelectSchema.min(
          multiSelectOption.minSelections
        );
      }
      if (multiSelectOption.maxSelections !== undefined) {
        multiSelectSchema = multiSelectSchema.max(
          multiSelectOption.maxSelections
        );
      }

      return multiSelectSchema;

    case "time":
      const timeOption = option as TimeConfigOption;
      let timeSchema = z.number();

      if (timeOption.min !== undefined) {
        timeSchema = timeSchema.min(timeOption.min);
      }
      if (timeOption.max !== undefined) {
        timeSchema = timeSchema.max(timeOption.max);
      }

      return timeSchema;

    case "array":
      const arrayOption = option as ArrayConfigOption;
      const itemSchema = generateZodSchema(arrayOption.itemType);
      let arrayTypeSchema = z.array(itemSchema);

      if (arrayOption.minItems !== undefined) {
        arrayTypeSchema = arrayTypeSchema.min(arrayOption.minItems);
      }
      if (arrayOption.maxItems !== undefined) {
        arrayTypeSchema = arrayTypeSchema.max(arrayOption.maxItems);
      }

      return arrayTypeSchema;

    case "object":
      const objectOption = option as ObjectConfigOption;
      const schemaFields: Record<string, z.ZodTypeAny> = {};

      for (const [key, propOption] of Object.entries(objectOption.schema)) {
        schemaFields[key] = generateZodSchema(propOption);
      }

      return z.object(schemaFields);

    case "channel":
      const channelOption = option as ChannelConfigOption;
      if (channelOption.allowNone) {
        return z
          .string()
          .regex(/^\d{17,19}$/)
          .nullable();
      }
      return z.string().regex(/^\d{17,19}$/);

    case "role":
      const roleOption = option as RoleConfigOption;
      if (roleOption.allowNone) {
        return z
          .string()
          .regex(/^\d{17,19}$/)
          .nullable();
      }
      return z.string().regex(/^\d{17,19}$/);

    case "user":
      const userOption = option as UserConfigOption;
      if (userOption.allowNone) {
        return z
          .string()
          .regex(/^\d{17,19}$/)
          .nullable();
      }
      return z.string().regex(/^\d{17,19}$/);

    default:
      return z.any();
  }
}

function generateCategorySchema(category: ConfigCategory): z.ZodObject<any> {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  for (const [key, option] of Object.entries(category.options)) {
    schemaFields[key] = generateZodSchema(option);
  }

  return z.object(schemaFields);
}

function generateModuleSchema(moduleConfig: ModuleConfig): z.ZodObject<any> {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    enabled: z.boolean(),
  };

  for (const [categoryKey, category] of Object.entries(
    moduleConfig.categories
  )) {
    schemaFields[categoryKey] = generateCategorySchema(category);
  }

  return z.object(schemaFields);
}

function generateModuleSettingsSchema<T extends ModuleConfig>(
  moduleConfig: T
): z.ZodType<ModuleSettings<T>> {
  return generateModuleSchema(moduleConfig) as unknown as z.ZodType<
    ModuleSettings<T>
  >;
}

export class ZodConfigValidator {
  private schemas: Map<string, z.ZodTypeAny> = new Map();
  private moduleConfigs: Map<string, ModuleConfig> = new Map();

  registerModule<T extends ModuleConfig>(
    moduleId: string,
    moduleConfig: T
  ): void {
    const schema = generateModuleSettingsSchema(moduleConfig);
    this.schemas.set(moduleId, schema);
    this.moduleConfigs.set(moduleId, moduleConfig);
  }

  validateModuleSettings<T extends ModuleConfig>(
    moduleId: string,
    data: unknown
  ): {
    success: boolean;
    data?: ModuleSettings<T>;
    errors?: z.ZodError;
  } {
    const schema = this.schemas.get(moduleId);
    if (!schema) {
      throw new Error(`No schema registered for module: ${moduleId}`);
    }

    const result = schema.safeParse(data);

    if (result.success) {
      const moduleConfig = this.moduleConfigs.get(moduleId);
      if (moduleConfig) {
        const crossFieldErrors = this.validateCrossFieldConstraints(
          moduleConfig,
          result.data
        );
        if (crossFieldErrors.length > 0) {
          const zodError = new z.ZodError(
            crossFieldErrors.map((error) => ({
              code: "custom",
              message: error.message,
              path: error.path,
            }))
          );
          return {
            success: false,
            errors: zodError,
          };
        }
      }

      return {
        success: true,
        data: result.data as ModuleSettings<T>,
      };
    } else {
      return {
        success: false,
        errors: result.error,
      };
    }
  }

  private validateCrossFieldConstraints(
    moduleConfig: ModuleConfig,
    data: any
  ): Array<{ path: (string | number)[]; message: string }> {
    const errors: Array<{ path: (string | number)[]; message: string }> = [];

    for (const [categoryKey, category] of Object.entries(
      moduleConfig.categories
    )) {
      for (const [optionKey, option] of Object.entries(category.options)) {
        if (
          option.crossFieldValidation &&
          option.crossFieldValidation.length > 0
        ) {
          const currentValue = data[categoryKey]?.[optionKey];

          for (const validation of option.crossFieldValidation) {
            const result = checkCrossFieldValidation(
              validation,
              data,
              currentValue
            );
            if (!result.isValid) {
              errors.push({
                path: [categoryKey, optionKey],
                message: result.errorMessage || "Cross-field validation failed",
              });
            }
          }
        }
      }
    }

    return errors;
  }
}

export interface ApiValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: {
    field: string;
    message: string;
  }[];
  message?: string;
}

export function validateModuleSettingsRequest<T extends ModuleConfig>(
  validator: ZodConfigValidator,
  moduleId: string,
  body: unknown
): ApiValidationResult<ModuleSettings<T>> {
  try {
    const result = validator.validateModuleSettings<T>(moduleId, body);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors =
        result.errors?.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })) || [];

      return {
        success: false,
        errors,
        message: "Validation failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: "root",
          message:
            error instanceof Error ? error.message : "Unknown validation error",
        },
      ],
      message: "Validation error",
    };
  }
}

export function createZodConfigValidator(): ZodConfigValidator {
  return new ZodConfigValidator();
}
