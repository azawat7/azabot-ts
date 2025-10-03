import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CustomClient } from "@/structures";

export abstract class Command {
  public guildOnly: boolean = true;
  constructor(
    public client: CustomClient,
    public commandInfo: SlashCommandBuilder,
    guildOnly: boolean = true
  ) {
    this.guildOnly = guildOnly;
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (this.guildOnly && (!interaction.inGuild() || !interaction.guild))
      return;
    await this.run(interaction);
  }

  abstract run(interaction: ChatInputCommandInteraction): Promise<void>;
}
