import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";
import { withGuildPermissions } from "@/app/lib/discord/middleware";
import { GuildService, GuildError } from "@/app/lib/discord/guild.service";
import { logger } from "@shaw/utils";
import { DatabaseManager } from "@shaw/database";
import { ModuleSettings } from "@shaw/types";

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
            const body = await req.json();
            const { module } = body;

            if (!module || typeof module !== "string") {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message: "Module name is required and must be a string",
                },
                { status: 400 }
              );
            }

            const validModules: Array<keyof ModuleSettings> = ["leveling"];
            if (!validModules.includes(module as keyof ModuleSettings)) {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message: `Invalid module name. Valid modules: ${validModules.join(
                    ", "
                  )}`,
                },
                { status: 400 }
              );
            }

            const db = DatabaseManager.getInstance();
            await db.ensureConnection();

            const updatedGuild = await db.guilds.toggleModule(
              resolvedGuildId,
              module as keyof ModuleSettings
            );

            if (!updatedGuild) {
              return NextResponse.json(
                {
                  error: GuildError.INTERNAL_ERROR,
                  message: "Failed to toggle module",
                },
                { status: 500 }
              );
            }

            return NextResponse.json({
              success: true,
              module: module,
              enabled:
                updatedGuild.modules[module as keyof ModuleSettings].enabled,
              modules: updatedGuild.modules,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : GuildError.INTERNAL_ERROR;

            logger.error("Error toggling module:", error);

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
