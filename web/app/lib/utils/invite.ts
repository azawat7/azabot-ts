export function generateDiscordInviteUrl(clientId: string): string {
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot+applications.commands`;
}
