import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/auth";
import { withSecurity } from "@/app/lib/security";
import { GuildService, GuildError } from "@/app/lib/discord/guild.service";
import { logger } from "@shaw/utils";

export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async (req) => {
      return withAuth(req, async (_, user, discordAccessToken) => {
        try {
          const result = await GuildService.getUserAdminGuilds(
            user.id,
            discordAccessToken
          );

          return NextResponse.json({
            guilds: result.guilds,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : GuildError.INTERNAL_ERROR;

          if (
            errorMessage === GuildError.DISCORD_API_ERROR ||
            errorMessage === GuildError.INTERNAL_ERROR
          ) {
            logger.error("Error fetching guilds:", error);
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

export async function DELETE(request: NextRequest) {
  return withSecurity(
    request,
    async (req) => {
      return withAuth(req, async (_, user) => {
        try {
          await GuildService.clearUserGuildCache(user.id);

          return NextResponse.json({
            success: true,
            message: "Guild cache cleared",
          });
        } catch (error) {
          logger.error("Error clearing guild cache:", error);
          return NextResponse.json(
            { error: GuildError.INTERNAL_ERROR },
            { status: 500 }
          );
        }
      });
    },
    { csrf: true, rateLimit: { tier: "moderate" } }
  );
}
