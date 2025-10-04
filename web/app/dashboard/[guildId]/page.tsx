import { SessionManager } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { GuildService } from "@/app/lib/discord/guild.service";
import { DatabaseManager } from "@shaw/database";
import { generateDiscordInviteUrl } from "@/app/lib/utils/invite";
import { env } from "@/app/lib/config";
import GuildDashboard from "./GuildDashboard";
import InviteRedirect from "@/app/components/auth/InviteRedirect";

export default async function GuildDashboardPage({
  params,
}: {
  params: { guildId: string };
}) {
  const { guildId } = await params;
  const session = await SessionManager.getSession();

  if (!session) {
    redirect("/");
  }

  const hasAccess = await GuildService.validateGuildAccess(
    guildId,
    session.discordAccessToken
  );

  if (!hasAccess.hasPermission) {
    redirect("/dashboard");
  }

  const db = DatabaseManager.getInstance();
  await db.ensureConnection();
  const guildSettings = await db.guilds.get(guildId);

  if (!guildSettings) {
    const inviteUrl = generateDiscordInviteUrl(env.clientId, guildId);
    return <InviteRedirect inviteUrl={inviteUrl} />;
  }

  return <GuildDashboard />;
}
