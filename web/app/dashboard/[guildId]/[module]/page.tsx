import { SessionManager } from "@/app/lib/auth";
import GuildModule from "./GuildModule";
import { redirect } from "next/navigation";
import { GuildService } from "@/app/lib/discord/guild.service";
import { DatabaseManager } from "@shaw/database";
import { generateDiscordInviteUrl } from "@/app/lib/utils/invite";
import { env } from "@/app/lib/config";
import InviteRedirect from "@/app/components/auth/InviteRedirect";

export default async function GuildModulePage({
  params,
}: {
  params: Promise<{ guildId: string; module: string }>;
}) {
  const { guildId } = await params;
  const session = await SessionManager.getSession();

  if (!session) {
    redirect("/");
  }

  const hasAccess = await GuildService.validateGuildAccess(
    guildId,
    session.discordAccessToken,
    session.user.id
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

  return <GuildModule />;
}
