import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";
import { withGuildPermissions } from "@/app/lib/discord/middleware";
import { GuildService, GuildError } from "@/app/lib/discord/guild.service";
import { logger } from "@shaw/utils";
import { DatabaseManager } from "@shaw/database";
import {
  ModuleSettings,
  ALL_MODULE_CONFIGS,
  createZodConfigValidator,
  validateModuleSettingsRequest,
  type ApiValidationResult,
} from "@shaw/types";

interface SaveModuleSettingsRequest {
  module: keyof ModuleSettings;
  settings: Record<string, any>;
}

const validator = createZodConfigValidator();

Object.entries(ALL_MODULE_CONFIGS).forEach(([moduleId, moduleConfig]) => {
  validator.registerModule(moduleId, moduleConfig);
});

function validateModuleSettings(
  module: keyof ModuleSettings,
  settings: Record<string, any>
): ApiValidationResult<any> {
  const moduleConfig =
    ALL_MODULE_CONFIGS[module as keyof typeof ALL_MODULE_CONFIGS];
  if (!moduleConfig) {
    return {
      success: false,
      errors: [{ field: "module", message: `Unknown module: ${module}` }],
      message: "Unknown module",
    };
  }

  const settingsWithEnabled = {
    enabled: true,
    ...settings,
  };

  return validateModuleSettingsRequest(validator, module, settingsWithEnabled);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  return withSecurity(
    request,
    async (req) => {
      return withGuildPermissions(
        req,
        async (_, resolvedGuildId) => {
          try {
            const body: SaveModuleSettingsRequest = await req.json();
            const { module, settings } = body;

            if (!module || typeof module !== "string") {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message: "Module name is required and must be a string",
                },
                { status: 400 }
              );
            }

            if (!settings || typeof settings !== "object") {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message: "Settings object is required",
                },
                { status: 400 }
              );
            }

            if (
              !ALL_MODULE_CONFIGS[module as keyof typeof ALL_MODULE_CONFIGS]
            ) {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message: `Unknown module: ${module}`,
                },
                { status: 400 }
              );
            }

            const db = DatabaseManager.getInstance();
            await db.ensureConnection();

            const guild = await db.guilds.get(resolvedGuildId);
            if (!guild) {
              return NextResponse.json(
                {
                  error: GuildError.NOT_FOUND,
                  message: "Guild not found",
                },
                { status: 404 }
              );
            }

            const moduleData = guild.modules[module as keyof ModuleSettings];
            if (!moduleData?.enabled) {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message:
                    "Module must be enabled before settings can be saved",
                },
                { status: 400 }
              );
            }

            const existingModuleData =
              guild.modules[module as keyof ModuleSettings];
            if (!existingModuleData) {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message: "Module not found",
                },
                { status: 400 }
              );
            }

            const validationResult = validateModuleSettings(
              module as keyof ModuleSettings,
              settings
            );

            if (!validationResult.success) {
              return NextResponse.json(
                {
                  error: "Validation Error",
                  message:
                    validationResult.message ||
                    "One or more settings are invalid",
                  validationErrors: validationResult.errors,
                },
                { status: 400 }
              );
            }

            const updatedGuild = await db.guilds.upsert(
              { guildId: resolvedGuildId },
              {
                [`modules.${module}`]: settings,
              }
            );

            if (!updatedGuild) {
              return NextResponse.json(
                {
                  error: GuildError.INTERNAL_ERROR,
                  message: "Failed to save module settings",
                },
                { status: 500 }
              );
            }

            return NextResponse.json({
              success: true,
              message: "Module settings saved successfully",
              module: module,
              settings: updatedGuild.modules[module as keyof ModuleSettings],
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : GuildError.INTERNAL_ERROR;

            logger.error("Error saving module settings:", error);

            const statusCode = GuildService.getErrorStatusCode(
              errorMessage as GuildError
            );

            return NextResponse.json(
              {
                error: errorMessage,
                message: GuildService.getErrorMessage(
                  errorMessage as GuildError
                ),
              },
              { status: statusCode }
            );
          }
        },
        guildId
      );
    },
    { csrf: true, rateLimit: { tier: "moderate" } }
  );
}
