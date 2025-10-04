export function generateDiscordInviteUrl(
  clientId: string,
  guildId?: string
): string {
  const baseUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot+applications.commands`;

  if (guildId) {
    return `${baseUrl}&guild_id=${guildId}`;
  }

  return baseUrl;
}
