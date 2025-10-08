"use client";

import { ALL_MODULE_CONFIGS, ModuleSettings } from "@shaw/types";

import { useState, useEffect } from "react";
import { redirect, useParams } from "next/navigation";

import { useGuildContext } from "@/app/contexts/GuildContext";
import { useCSRF } from "@/app/hooks/useCSRF";

import { DynamicFormRenderer } from "@/app/components/ui/form/DynamicFormRenderer";
import { ActionButton } from "@/app/components/ui/ActionButton";
import { GuildModuleSkeleton } from "@/app/components/ui/Skeleton";

import * as HeroIcons from "react-icons/hi2";
import {
  HiCheck,
  HiXMark,
  HiArrowPath,
  HiArrowUturnLeft,
} from "react-icons/hi2";

export default function GuildModule() {
  const params = useParams();
  const guildId = params.guildId as string;
  const moduleUrlName = params.module as string;
  const {
    guildDetails,
    guildDetailsLoading,
    guildDetailsError,
    updateModuleSettings,
    fetchGuildDetails,
    clearGuildDetails,
  } = useGuildContext();
  const currentGuildDetails = guildDetails[guildId];
  const loading = guildDetailsLoading[guildId] || false;
  const error = guildDetailsError[guildId] || null;

  const { getHeaders } = useCSRF();

  const moduleConfig = Object.values(ALL_MODULE_CONFIGS).find(
    (config) => config.id === moduleUrlName
  );

  const currentSettings = (currentGuildDetails?.modules as any)?.[
    moduleUrlName
  ];

  const getDefaultValue = (type: string): any => {
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
  };

  const initializeFormData = () => {
    if (!moduleConfig) return {};

    const defaultData: any = { enabled: currentSettings?.enabled ?? false };

    Object.entries(moduleConfig.categories).forEach(
      ([categoryKey, category]) => {
        defaultData[categoryKey] = {};
        Object.entries(category.options).forEach(([fieldKey, fieldConfig]) => {
          const currentValue =
            currentSettings?.[categoryKey as keyof typeof currentSettings]?.[
              fieldKey
            ];
          defaultData[categoryKey][fieldKey] =
            currentValue ??
            fieldConfig.default ??
            getDefaultValue(fieldConfig.type);
        });
      }
    );

    return defaultData;
  };

  const [formData, setFormData] = useState<any>(initializeFormData());
  const [originalFormData, setOriginalFormData] = useState<any>(
    initializeFormData()
  );
  const [hasChanges, setHasChanges] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [refreshButtonLoading, setRefreshButtonLoading] = useState(false);

  useEffect(() => {
    if (currentSettings && moduleConfig) {
      const initialData = initializeFormData();
      setFormData(initialData);
      setOriginalFormData(initialData);
      setHasChanges(false);
    }
  }, [currentSettings, moduleConfig]);

  useEffect(() => {
    const changed =
      JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasChanges(changed);
  }, [formData, originalFormData]);

  useEffect(() => {
    if (saveStatus === "success" || saveStatus === "error") {
      const timer = setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleRefresh = async () => {
    try {
      setRefreshButtonLoading(true);
      const headers = await getHeaders();
      await fetch(`/api/guilds/${guildId}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      clearGuildDetails(guildId);
      await fetchGuildDetails(guildId);
    } catch (err) {
      console.error("Failed to refresh guild data:", err);
    } finally {
      setRefreshButtonLoading(false);
    }
  };

  const getDefaultFormData = () => {
    if (!moduleConfig) return {};

    const defaultData: any = { enabled: currentSettings?.enabled ?? false };

    Object.entries(moduleConfig.categories).forEach(
      ([categoryKey, category]) => {
        defaultData[categoryKey] = {};
        Object.entries(category.options).forEach(([fieldKey, fieldConfig]) => {
          defaultData[categoryKey][fieldKey] =
            fieldConfig.default ?? getDefaultValue(fieldConfig.type);
        });
      }
    );

    return defaultData;
  };

  const isAtDefaultValues = () => {
    if (!moduleConfig) return true;

    const defaultData = getDefaultFormData();
    return JSON.stringify(formData) === JSON.stringify(defaultData);
  };

  const handleReset = () => {
    if (!moduleConfig) return;
    const defaultData = getDefaultFormData();
    setFormData(defaultData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setValidationErrors({});

    try {
      const headers = await getHeaders();
      const csrfToken = headers["x-csrf-token"];

      if (!csrfToken) {
        throw new Error("Failed to get CSRF token");
      }

      const result = await updateModuleSettings(
        guildId,
        moduleUrlName as keyof ModuleSettings,
        formData,
        csrfToken
      );

      if (result.success) {
        setSaveStatus("success");
        setSaveMessage(result.message || "Settings saved successfully");
        setOriginalFormData(formData);
        setHasChanges(false);
      } else {
        setSaveStatus("error");
        setSaveMessage(result.message || "Failed to save settings");
        console.log(result.validationErrors);
        if (result.validationErrors) {
          const errors: Record<string, string> = {};
          result.validationErrors.forEach((error: any) => {
            const fieldPath = error.field;
            if (fieldPath) {
              errors[fieldPath] = error.message;
            }
          });
          setValidationErrors(errors);
        }
      }
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(
        err instanceof Error ? err.message : "Failed to save settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (path: string, value: any) => {
    setFormData((prev: any) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  if (loading) {
    return <GuildModuleSkeleton />;
  }

  if (error || !currentGuildDetails) return redirect("/dashboard");

  if (!moduleConfig) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Module Not Found
          </h1>
          <p className="text-neutral-400">
            The requested module could not be found.
          </p>
        </div>
      </div>
    );
  }

  const IconComponent = moduleConfig.reactIconName
    ? (HeroIcons as any)[moduleConfig.reactIconName]
    : null;

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {/* Module Header */}
      <div className="mx-6 px-8 py-6 rounded-2xl border-1 border-default-border bg-secondary-background mb-6 select-none flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
              {IconComponent ? (
                <IconComponent className="text-sky-500 text-3xl" />
              ) : (
                <span className="text-sky-500 text-3xl">
                  {moduleConfig.icon}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-primary-text">
                  {moduleConfig.name}
                </h1>
                {!formData.enabled && (
                  <div className="flex items-center gap-2 px-3 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-secondary-text text-sm font-medium">
                      Enable this module to modify its settings
                    </span>
                  </div>
                )}
              </div>
              <p className="text-secondary-text">{moduleConfig.description}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {saveStatus === "success" && (
              <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                <HiCheck className="w-4 h-4" />
                <span>Saved</span>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                <HiXMark className="w-4 h-4" />
                <span>Error</span>
              </div>
            )}
            <ActionButton
              size="md"
              onAction={handleRefresh}
              isLoading={refreshButtonLoading}
              variant="icon-text"
              icon={<HiArrowPath className="w-5 h-5 text-primary-text" />}
              text="Refresh"
              loadingIcon={
                <HiArrowPath className="w-5 h-5 text-primary-text animate-spin" />
              }
            />
            <ActionButton
              size="md"
              onAction={handleReset}
              disabled={!formData.enabled || isAtDefaultValues()}
              variant="icon-text"
              icon={<HiArrowUturnLeft className="w-5 h-5 text-primary-text" />}
              text="Reset to Defaults"
              title={
                !formData.enabled
                  ? "Enable this module to reset settings"
                  : isAtDefaultValues()
                  ? "Settings are already at default values"
                  : "Reset all settings to their default values"
              }
            />
            <ActionButton
              size="md"
              onAction={handleSave}
              isLoading={isSaving}
              disabled={isSaving || !formData.enabled || !hasChanges}
              variant="icon-text"
              icon={<HiCheck className="w-5 h-5 text-primary-text" />}
              text="Save"
              loadingIcon={
                <HiArrowPath className="w-5 h-5 text-primary-text animate-spin" />
              }
              className={hasChanges ? "border-1 border-orange-500" : ""}
              title={
                !formData.enabled
                  ? "Enable this module to save settings"
                  : !hasChanges
                  ? "No changes to save"
                  : "Save settings"
              }
            />
          </div>
        </div>
      </div>

      {/* Module Settings Form */}
      <div className="px-6 pb-6">
        {moduleConfig && (
          <DynamicFormRenderer
            config={moduleConfig}
            formData={formData}
            originalFormData={originalFormData}
            onChange={updateFormData}
            validationErrors={validationErrors}
            disabled={!formData.enabled}
          />
        )}
      </div>
    </div>
  );
}
