import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { CustomBaseClient, BaseCommand } from "@/base";

export default class RankCommand extends BaseCommand {
  constructor(client: CustomBaseClient) {
    super(
      client,
      new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Check your or someone else's rank and level")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to check rank for")
            .setRequired(false)
        ) as SlashCommandBuilder
    );
  }
  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser =
      (interaction.options.get("user")?.user as User) || interaction.user;
  }
}
