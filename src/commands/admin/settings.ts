import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { CustomBaseClient, BaseCommand } from "@/base";
import { SettingsUtils } from "@/utils/SettingsUtils";

export default class SettingsCommand extends BaseCommand {
  constructor(client: CustomBaseClient) {
    super(
      client,
      new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Manages my settings on your server.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    );
  }
  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildData = await this.client.db.guilds.getOrCreate(
      interaction.guild!.id
    );
    const mainPage = SettingsUtils.createSettingsContainer(
      interaction,
      guildData
    );
    await interaction.reply({
      components: [mainPage],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
