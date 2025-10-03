import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/auth";
import { withSecurity } from "@/app/lib/security";
import { DiscordService } from "@/app/lib/discord";
import { DatabaseManager } from "@shaw/database";

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
          const guildsResponse = await DiscordService.makeAPICall(
            "/users/@me/guilds",
            discordAccessToken
          );

          if (!guildsResponse.ok) {
            return NextResponse.json(
              { error: "Failed to verify guild access" },
              { status: guildsResponse.status }
            );
          }

          const guilds = await guildsResponse.json();
          const guild = guilds.find((g: any) => g.id === guildId);

          const permissions = BigInt(guild.permissions);
          const ADMINISTRATOR = BigInt(0x8);
          const MANAGE_GUILD = BigInt(0x20);
          const hasPermission =
            (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
            (permissions & MANAGE_GUILD) === MANAGE_GUILD;

          if (!hasPermission) {
            return NextResponse.json(
              { error: "Insufficient permissions" },
              { status: 403 }
            );
          }

          const db = DatabaseManager.getInstance();
          await db.ensureConnection();

          const guildSettings = await db.guilds.get(guildId);

          if (!guildSettings) {
            return NextResponse.json(
              { error: "Bot not added to server" },
              { status: 404 }
            );
          }

          return NextResponse.json({
            info: { id: guild.id, name: guild.name, icon: guild.icon },
            modules: guildSettings.modules,
          });
        } catch (error) {
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
