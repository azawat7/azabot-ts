import {
  ButtonInteraction,
  Interaction,
  MessageFlags,
  PermissionsBitField,
} from "discord.js";
import { CustomBaseClient, BaseEvent } from "@/base";
import { IGuild, IGuildModules } from "@/database/models/Guild";
import { moduleDescriptions, SettingsUtils } from "@/utils/SettingsUtils";

export default class ButtonInteractionCreateEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "interactionCreate");
  }
  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;
    const splitId = interaction.customId.split("-");

    if (splitId[0] === "settings") {
      if (!this.checkIfMemberIsAdmin(interaction)) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "What are you even hoping for",
        });
        return;
      }

      const moduleName = splitId[1] as keyof IGuildModules;
      if (splitId[2] === "toggle") {
        const guildData = (await this.client.db.guilds.toggleModule(
          interaction.guild?.id!,
          moduleName
        )) as IGuild;
        interaction.reply({
          content: `Successfully toggled **${
            guildData.modules[moduleName].enabled ? "on" : "off"
          }** the ${moduleDescriptions[moduleName].name} module.`,
          flags: MessageFlags.Ephemeral,
        });
        interaction.message.edit({
          components: [
            SettingsUtils.createSettingsContainer(interaction, guildData),
          ],
        });
      }
      if (splitId[1] === "homePage") {
        const guildData = await this.client.db.guilds.getOrCreate(
          interaction.guild?.id!
        );
        interaction.message.edit({
          components: [
            SettingsUtils.createSettingsContainer(interaction, guildData),
          ],
        });
      }
      if (splitId[2] === "config") {
        const guildData = await this.client.db.guilds.getOrCreate(
          interaction.guild?.id!
        );
        interaction.message.edit({
          components: [
            SettingsUtils.createSettingsContainer(
              interaction,
              guildData,
              moduleName
            ),
          ],
        });
      }
    }
  }

  private checkIfMemberIsAdmin(interaction: ButtonInteraction) {
    if (
      interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return true;
    return false;
  }
}
