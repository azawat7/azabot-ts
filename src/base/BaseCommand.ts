import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { CustomBaseClient } from "@/base";

export abstract class BaseCommand {
  constructor(
    public client: CustomBaseClient,
    public commandInfo: SlashCommandBuilder
  ) {}
  abstract run(interaction: CommandInteraction): Promise<void>;
}
