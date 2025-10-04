import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/auth";
import { withSecurity } from "@/app/lib/security";
import { DiscordService } from "@/app/lib/discord";
import { DatabaseManager } from "@shaw/database";
import { logger } from "@shaw/utils";

const GUILDS_CACHE_TTL = 60 * 60;

export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async (req) => {
      return withAuth(req, async (_, user, discordAccessToken) => {
        try {
          const db = DatabaseManager.getInstance();
          await db.ensureConnection();

          const cacheKey = `adminGuilds:${user.id}`;
          const cachedGuilds = await db.cache.get<any[]>(cacheKey);

          if (cachedGuilds) {
            return NextResponse.json({
              guilds: cachedGuilds,
              cached: true,
            });
          }

          const response = await DiscordService.makeAPICall(
            "/users/@me/guilds",
            discordAccessToken
          );

          if (!response.ok) {
            return NextResponse.json(
              { error: "Failed to fetch guilds" },
              { status: response.status }
            );
          }

          const guilds = await response.json();

          const adminGuilds = guilds.filter((guild: any) => {
            const permissions = BigInt(guild.permissions);
            const ADMINISTRATOR = BigInt(0x8);
            const MANAGE_GUILD = BigInt(0x20);
            return (
              (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
              (permissions & MANAGE_GUILD) === MANAGE_GUILD
            );
          });

          const formattedGuilds = adminGuilds.map((guild: any) => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
          }));

          await db.cache.set(cacheKey, formattedGuilds, GUILDS_CACHE_TTL);
          return NextResponse.json({
            guilds: formattedGuilds,
            cached: false,
          });
        } catch (error) {
          logger.error("Error fetching guilds:", error);
          return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
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
          const db = DatabaseManager.getInstance();
          await db.ensureConnection();

          const cacheKey = `adminGuilds:${user.id}`;
          await db.cache.delete(cacheKey);

          return NextResponse.json({
            success: true,
            message: "Guild cache cleared",
          });
        } catch (error) {
          return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
          );
        }
      });
    },
    { csrf: true, rateLimit: { tier: "moderate" } }
  );
}
