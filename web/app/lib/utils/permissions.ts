export const DISCORD_PERMISSIONS = {
  ADMINISTRATOR: BigInt(0x8),
  MANAGE_GUILD: BigInt(0x20),
} as const;

export type PermissionLevel = "admin" | "manage" | "none";

export function getPermissionLevel(permissions: string): PermissionLevel {
  const permissionsBigInt = BigInt(permissions);
  if (
    (permissionsBigInt & DISCORD_PERMISSIONS.ADMINISTRATOR) ===
    DISCORD_PERMISSIONS.ADMINISTRATOR
  ) {
    return "admin";
  }
  if (
    (permissionsBigInt & DISCORD_PERMISSIONS.MANAGE_GUILD) ===
    DISCORD_PERMISSIONS.MANAGE_GUILD
  ) {
    return "manage";
  }
  return "none";
}
