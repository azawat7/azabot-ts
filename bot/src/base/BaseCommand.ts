import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CustomBaseClient } from "@/base";

export abstract class BaseCommand {
  public guildOnly: boolean = true;
  constructor(
    public client: CustomBaseClient,
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
