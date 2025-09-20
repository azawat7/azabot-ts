import {
  AnySelectMenuInteraction,
  Interaction,
  MessageFlags,
  PermissionsBitField,
} from "discord.js";
import { CustomBaseClient, BaseEvent } from "@/base";
import { IGuild, IGuildModules } from "@/database/models/Guild";
import { moduleDescriptions, SettingsUtils } from "@/utils/SettingsUtils";

export default class SelectMenuInteractionCreateEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "interactionCreate");
  }
  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isAnySelectMenu()) return;
    const splitId = interaction.customId.split("-");

    if (splitId[0] === "settings") {
      if (!this.checkIfMemberIsAdmin(interaction)) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "What are you even hoping for",
        });
        return;
      }

      if (splitId[1] === "subcategorySelect") {
        const splitInteractionValue: any = interaction.values[0].split("-"); // TODO ADD TYPES

        const guildData = await this.client.db.guilds.getOrCreate(
          interaction.guild?.id!
        );
        interaction.message.edit({
          components: [
            SettingsUtils.createSettingsContainer(
              interaction,
              guildData,
              splitInteractionValue[1],
              splitInteractionValue[2]
            ),
          ],
        });
        await interaction.reply({
          content: "Success",
          flags: MessageFlags.Ephemeral,
        });
        await interaction.deleteReply();
      }
    }
  }

  private checkIfMemberIsAdmin(interaction: AnySelectMenuInteraction) {
    if (
      interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return true;
    return false;
  }
}
