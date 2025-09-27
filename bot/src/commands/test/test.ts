import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { CustomBaseClient, BaseCommand } from "@/base";

export default class TestCommand extends BaseCommand {
  constructor(client: CustomBaseClient) {
    super(
      client,
      new SlashCommandBuilder().setName("test").setDescription("Test command.")
    );
  }
  async run(interaction: CommandInteraction): Promise<void> {
    interaction.reply({ content: "Hello World!" });
  }
}
