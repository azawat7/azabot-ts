export const COMMAND_CATEGORIES = {
  TEST: "test",
  LEVEL: "leveling",
} as const;

export type CommandCategory =
  (typeof COMMAND_CATEGORIES)[keyof typeof COMMAND_CATEGORIES];

export interface CommandMetadata {
  name: string;
  description: string;
  category: CommandCategory;
  guildOnly?: boolean;
}

export const commandsMetadata: CommandMetadata[] = [
  // Test Commands
  {
    name: "test",
    description: "Test command.",
    category: COMMAND_CATEGORIES.TEST,
    guildOnly: true,
  },

  // Level Commands
  {
    name: "rank",
    description: "Check your or someone else's rank and level",
    category: COMMAND_CATEGORIES.LEVEL,
    guildOnly: true,
  },
];

export function getCommandByName(name: string): CommandMetadata | undefined {
  return commandsMetadata.find((cmd) => cmd.name === name);
}

export function getCommandsGroupedByCategory(): Record<
  string,
  CommandMetadata[]
> {
  return commandsMetadata.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandMetadata[]>);
}
