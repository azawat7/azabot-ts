import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";
import { withGuildPermissions } from "@/app/lib/discord/middleware";
import { GuildService, GuildError } from "@/app/lib/discord/guild.service";
import { logger } from "@shaw/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  return withSecurity(
    request,
    async (req) => {
      return withGuildPermissions(
        req,
        async (
          _,
          resolvedGuildId,
          user,
          discordAccessToken,
          guild,
          guildSettings
        ) => {
          try {
            const [rolesResult, channelsResult] = await Promise.all([
              GuildService.getGuildRoles(guildId),
              GuildService.getGuildChannels(guildId),
            ]);

            return NextResponse.json({
              info: guild,
              modules: guildSettings.modules,
              roles: rolesResult.roles,
              channels: channelsResult.channels,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : GuildError.INTERNAL_ERROR;

            if (
              errorMessage !== GuildError.BOT_NOT_IN_SERVER &&
              errorMessage !== GuildError.NOT_FOUND &&
              errorMessage !== GuildError.NO_PERMISSION
            ) {
              logger.error("Error fetching guild data:", error);
            }

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
    { rateLimit: { tier: "moderate" } }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  return withSecurity(
    request,
    async (req) => {
      return withGuildPermissions(
        req,
        async (_) => {
          try {
            await GuildService.clearAllGuildCaches(guildId);

            return NextResponse.json({
              success: true,
              message: "Guild cache cleared successfully",
            });
          } catch (error) {
            logger.error("Error clearing guild cache:", error);
            return NextResponse.json(
              {
                error: GuildError.INTERNAL_ERROR,
                message: "Failed to clear guild cache",
              },
              { status: 500 }
            );
          }
        },
        guildId
      );
    },
    { csrf: true, rateLimit: { tier: "moderate" } }
  );
}
