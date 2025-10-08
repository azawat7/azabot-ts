import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";
import { withGuildPermissions } from "@/app/lib/discord/middleware";
import { GuildService, GuildError } from "@/app/lib/discord/guild.service";
import { logger } from "@shaw/utils";
import { DatabaseManager } from "@shaw/database";
import { getCommandByName } from "@shaw/types";

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
            const { commandName } = body;

            if (!commandName || typeof commandName !== "string") {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message: "Command name is required and must be a string",
                },
                { status: 400 }
              );
            }

            const commandMetadata = getCommandByName(commandName);
            if (!commandMetadata) {
              return NextResponse.json(
                {
                  error: "Bad Request",
                  message: `Command '${commandName}' does not exist`,
                },
                { status: 400 }
              );
            }

            const db = DatabaseManager.getInstance();
            await db.ensureConnection();

            const updatedGuild = await db.guilds.toggleCommand(
              resolvedGuildId,
              commandName
            );

            if (!updatedGuild) {
              return NextResponse.json(
                {
                  error: GuildError.INTERNAL_ERROR,
                  message: "Failed to toggle command",
                },
                { status: 500 }
              );
            }

            return NextResponse.json({
              success: true,
              commandName,
              disabledCommands: updatedGuild.disabledCommands,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : GuildError.INTERNAL_ERROR;

            logger.error("Error toggling command:", error);

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
