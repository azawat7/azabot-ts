import { NextRequest, NextResponse } from "next/server";
import { logger } from "@shaw/utils";
import { GuildService, GuildError, UserGuild } from "./guild.service";
import { withAuth } from "@/app/lib/auth";
import { DatabaseManager } from "@shaw/database";
import { IGuild } from "@shaw/types";

type GuildPermissionsHandler = (
  request: NextRequest,
  guildId: string,
  user: any,
  discordAccessToken: string,
  guild: UserGuild,
  guildSettings: IGuild
) => Promise<NextResponse>;

export async function withGuildPermissions(
  request: NextRequest,
  handler: GuildPermissionsHandler,
  guildId?: string
): Promise<NextResponse> {
  const resolvedGuildId = guildId || extractGuildIdFromUrl(request.url);

  if (!resolvedGuildId) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Guild ID is required",
      },
      { status: 400 }
    );
  }

  return withAuth(request, async (req, user, discordAccessToken) => {
    try {
      const db = DatabaseManager.getInstance();
      await db.ensureConnection();

      const guildSettings = await db.guilds.get(resolvedGuildId);
      if (!guildSettings) {
        return NextResponse.json(
          {
            error: GuildError.BOT_NOT_IN_SERVER,
            message: GuildService.getErrorMessage(GuildError.BOT_NOT_IN_SERVER),
          },
          {
            status: GuildService.getErrorStatusCode(
              GuildError.BOT_NOT_IN_SERVER
            ),
          }
        );
      }

      const permissionResult = await GuildService.validateGuildAccess(
        resolvedGuildId,
        discordAccessToken
      );

      if (!permissionResult.hasPermission) {
        const statusCode = GuildService.getErrorStatusCode(
          permissionResult.error || GuildError.NO_PERMISSION
        );
        const errorMessage = GuildService.getErrorMessage(
          permissionResult.error || GuildError.NO_PERMISSION
        );

        return NextResponse.json(
          {
            error: permissionResult.error || GuildError.NO_PERMISSION,
            message: errorMessage,
          },
          { status: statusCode }
        );
      }

      return handler(
        req,
        resolvedGuildId,
        user,
        discordAccessToken,
        permissionResult.guild as UserGuild,
        guildSettings
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : GuildError.INTERNAL_ERROR;

      if (
        errorMessage !== GuildError.BOT_NOT_IN_SERVER &&
        errorMessage !== GuildError.NOT_FOUND &&
        errorMessage !== GuildError.NO_PERMISSION
      ) {
        logger.error("Guild permissions middleware error:", error);
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
}

function extractGuildIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split("/");

    const guildIndex = pathSegments.findIndex(
      (segment) => segment === "guilds" || segment === "dashboard"
    );

    if (guildIndex !== -1 && pathSegments[guildIndex + 1]) {
      return pathSegments[guildIndex + 1];
    }

    return null;
  } catch {
    return null;
  }
}
