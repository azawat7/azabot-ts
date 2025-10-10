import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CustomClient } from "@/structures";
import { CommandMetadata, getCommandByName } from "@shaw/types";

export abstract class Command {
  public guildOnly: boolean = true;
  public metadata: CommandMetadata;

  constructor(
    public client: CustomClient,
    public commandInfo: SlashCommandBuilder,
    commandName: string
  ) {
    const metadata = getCommandByName(commandName);
    if (!metadata) {
      throw new Error(`Command metadata not found for command: ${commandName}`);
    }

    this.guildOnly = metadata.guildOnly ?? true;
    this.metadata = metadata;

    // Set name and description from metadata
    this.commandInfo
      .setName(metadata.name)
      .setDescription(metadata.description);
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (this.guildOnly && (!interaction.inGuild() || !interaction.guild))
      return;
    await this.run(interaction);
  }

  abstract run(interaction: ChatInputCommandInteraction): Promise<void>;
}
