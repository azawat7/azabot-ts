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
            return NextResponse.json({
              info: guild,
              modules: guildSettings.modules,
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
