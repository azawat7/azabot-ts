export const DISCORD_CONFIG = {
  clientId: process.env.WEB_DISCORD_CLIENT_ID!,
  clientSecret: process.env.WEB_DISCORD_CLIENT_SECRET!,
  redirectUri: `${process.env.WEB_BASE_URL}/api/auth/callback`,
  scope: "identify guilds",

  authUrl: "https://discord.com/api/oauth2/authorize",
  tokenUrl: "https://discord.com/api/oauth2/token",
  userUrl: "https://discord.com/api/users/@me",
};

export function getDiscordAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CONFIG.clientId,
    redirect_uri: DISCORD_CONFIG.redirectUri,
    response_type: "code",
    scope: DISCORD_CONFIG.scope,
  });

  if (state) {
    params.append("state", state);
  }

  return `${DISCORD_CONFIG.authUrl}?${params.toString()}`;
}
