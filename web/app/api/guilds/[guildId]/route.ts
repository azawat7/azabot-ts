import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/auth";
import { withSecurity } from "@/app/lib/security";
import { GuildService, GuildError } from "@/app/lib/services/GuildService";
import { logger } from "@shaw/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  return withSecurity(
    request,
    async (req) => {
      return withAuth(req, async (_, user, discordAccessToken) => {
        try {
          const guildData = await GuildService.getGuildWithPermissions(
            guildId,
            user.id,
            discordAccessToken
          );

          return NextResponse.json(guildData);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : GuildError.INTERNAL_ERROR;

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
              message: GuildService.getErrorMessage(errorMessage as GuildError),
            },
            { status: statusCode }
          );
        }
      });
    },
    { rateLimit: { tier: "relaxed" } }
  );
}
