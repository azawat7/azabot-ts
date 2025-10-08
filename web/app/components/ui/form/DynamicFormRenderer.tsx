"use client";

import { ReactNode } from "react";
import {
  FormField,
  TextInput,
  NumberInput,
  SelectInput,
  BooleanInput,
  TimeInput,
} from "./FormField";
import { ArrayField } from "./ArrayField";
import { RoleSelector } from "./RoleSelector";
import { ChannelSelector } from "./ChannelSelector";
import { ConfigCategory, ModuleConfig } from "@shaw/types";
import { HiTrash } from "react-icons/hi2";
import * as Icons from "react-icons/hi2";

interface DynamicFormRendererProps {
  config: ModuleConfig;
  formData: any;
  originalFormData?: any;
  onChange: (path: string, value: any) => void;
  validationErrors: Record<string, string>;
  disabled?: boolean;
}

export function DynamicFormRenderer({
  config,
  formData,
  originalFormData,
  onChange,
  validationErrors,
  disabled = false,
}: DynamicFormRendererProps) {
  const isFieldModified = (path: string): boolean => {
    if (!originalFormData) return false;
    const currentValue = getNestedValue(formData, path);
    const originalValue = getNestedValue(originalFormData, path);
    return JSON.stringify(currentValue) !== JSON.stringify(originalValue);
  };

  const renderField = (
    fieldKey: string,
    fieldConfig: any,
    categoryPath: string = "",
    isDisabled: boolean = false
  ): ReactNode => {
    const fullPath = categoryPath ? `${categoryPath}.${fieldKey}` : fieldKey;
    const value = getNestedValue(formData, fullPath);
    const error = validationErrors[fullPath];
    const isModified = isFieldModified(fullPath);

    const commonProps = {
      value,
      onChange: (newValue: any) => onChange(fullPath, newValue),
      error,
      disabled: disabled || isDisabled,
      isModified,
    };

    switch (fieldConfig.type) {
      case "string":
        return (
          <TextInput
            {...commonProps}
            placeholder={fieldConfig.placeholder}
            maxLength={fieldConfig.maxLength}
          />
        );

      case "number":
        return (
          <NumberInput
            {...commonProps}
            min={fieldConfig.min}
            max={fieldConfig.max}
            step={fieldConfig.step}
          />
        );

      case "time":
        return (
          <TimeInput
            {...commonProps}
            min={fieldConfig.min}
            max={fieldConfig.max}
            unit={fieldConfig.unit}
          />
        );

      case "select":
        return (
          <SelectInput
            {...commonProps}
            options={fieldConfig.options}
            placeholder={fieldConfig.placeholder}
          />
        );

      case "boolean":
        return <BooleanInput {...commonProps} />;

      case "channel":
        return (
          <ChannelSelector
            {...commonProps}
            allowNone={fieldConfig.allowNone}
            channelTypes={fieldConfig.channelTypes}
          />
        );

      case "role":
        return (
          <RoleSelector {...commonProps} allowNone={fieldConfig.allowNone} />
        );

      case "array":
        return (
          <ArrayField
            label=""
            description=""
            help=""
            error={error}
            value={value || []}
            onChange={(newValue) => onChange(fullPath, newValue)}
            createNewItem={() => createDefaultItem(fieldConfig.itemType.schema)}
            maxItems={fieldConfig.maxItems}
            disabled={disabled || isDisabled}
            renderItemHeaders={() => (
              <div className="flex items-center">
                {Object.entries(fieldConfig.itemType.schema).map(
                  ([itemKey, itemFieldConfig]: [string, any]) => (
                    <div key={itemKey} className="flex-1">
                      <label className="block text-sm font-medium text-neutral-300">
                        {itemFieldConfig.name}
                      </label>
                    </div>
                  )
                )}
                <div className="flex-shrink-0 w-10">
                  {/* Space for remove button */}
                </div>
              </div>
            )}
            renderItem={(item, index, onItemChange, onRemove) => (
              <div className="flex items-center gap-3 p-2 bg-zinc-800/30 rounded-md border border-zinc-600">
                {Object.entries(fieldConfig.itemType.schema).map(
                  ([itemKey, itemFieldConfig]: [string, any]) => {
                    const itemPath = `${fullPath}.${index}.${itemKey}`;
                    const itemValue = getNestedValue(item, itemKey);
                    const itemError = validationErrors[itemPath];

                    return (
                      <div key={itemKey} className="flex-1">
                        {renderField(
                          itemKey,
                          itemFieldConfig,
                          `${fullPath}.${index}`,
                          isDisabled
                        )}
                        {itemError && (
                          <p className="text-red-500 text-xs mt-1">
                            {itemError}
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={disabled || isDisabled}
                  className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Remove item"
                >
                  <HiTrash className="w-5 h-5" />
                </button>
              </div>
            )}
          />
        );

      default:
        return (
          <div className="text-red-500 text-sm">
            Unsupported field type: {fieldConfig.type}
          </div>
        );
    }
  };

  const renderCategory = (categoryKey: string, category: ConfigCategory) => {
    const renderCategoryIcon = () => {
      const IconComponent = (Icons as any)[category.reactIconName];
      console.log(IconComponent, category.reactIconName);
      if (IconComponent) {
        return <IconComponent className="w-8 h-8 text-blue-400" />;
      }
    };

    return (
      <div
        key={categoryKey}
        className="px-6 py-5 rounded-2xl border border-zinc-700 bg-zinc-900/50"
      >
        <div className="flex items-center gap-3 mb-6">
          {renderCategoryIcon()}
          <div>
            <h2 className="text-xl font-semibold text-white">
              {category.name}
            </h2>
            <p className="text-neutral-400 text-sm">{category.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {Object.entries(category.options).map(([fieldKey, fieldConfig]) => {
            let isDisabled = false;
            if (fieldConfig.dependencies) {
              const shouldEnable = fieldConfig.dependencies.every(
                (dep: any) => {
                  if (!dep.field) return true;
                  const depValue = getNestedValue(formData, dep.field);
                  return checkDependencyCondition(depValue, dep.condition);
                }
              );

              isDisabled = !shouldEnable;
            }

            return (
              <FormField
                key={fieldKey}
                label={fieldConfig.name}
                description={fieldConfig.description}
                help={fieldConfig.help}
                error={validationErrors[`${categoryKey}.${fieldKey}`]}
                required={fieldConfig.required}
              >
                {renderField(
                  fieldKey,
                  fieldConfig,
                  categoryKey,
                  disabled || isDisabled
                )}
              </FormField>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {Object.entries(config.categories)
        .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
        .map(([categoryKey, category]) =>
          renderCategory(categoryKey, category)
        )}
    </div>
  );
}

function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined;
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function checkDependencyCondition(value: any, condition: any): boolean {
  if (!condition) return true;

  switch (condition.type) {
    case "equals":
      return value === condition.value;
    case "notEquals":
      return value !== condition.value;
    case "in":
      return condition.values.includes(value);
    case "notIn":
      return !condition.values.includes(value);
    case "truthy":
      return Boolean(value);
    case "falsy":
      return !Boolean(value);
    case "greaterThan":
      return value > condition.value;
    case "lessThan":
      return value < condition.value;
    case "greaterThanOrEqual":
      return value >= condition.value;
    case "lessThanOrEqual":
      return value <= condition.value;
    default:
      return true;
  }
}

function createDefaultItem(schema: any): any {
  const item: any = {};
  Object.entries(schema).forEach(([key, fieldConfig]: [string, any]) => {
    item[key] = fieldConfig.default || getDefaultValue(fieldConfig.type);
  });
  return item;
}

function getDefaultValue(type: string): any {
  switch (type) {
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "array":
      return [];
    case "channel":
    case "role":
      return null;
    default:
      return null;
  }
}
