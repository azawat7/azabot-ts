import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { CustomClient, Command } from "@/structures";

export default class TestCommand extends Command {
  constructor(client: CustomClient) {
    super(client, new SlashCommandBuilder(), "test");
  }
  async run(interaction: CommandInteraction): Promise<void> {
    interaction.reply({ content: "Hello World!" });
  }
}
