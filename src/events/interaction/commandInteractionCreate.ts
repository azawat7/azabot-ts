import { Interaction } from "discord.js";
import { CustomBaseClient, BaseEvent } from "@/base";

export default class CommandInteractionCreateEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "interactionCreate");
  }
  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) return;
    const cmd = this.client.commands.get(interaction.commandName);
    if (!cmd) return;

    const guildData = this.client.db.guilds.getOrCreate(interaction.guild?.id!);
    const guildMemberData = this.client.db.guildMembers.getOrCreate(
      interaction.guild?.id!,
      interaction.user.id
    );

    cmd.run(interaction);
  }
}
