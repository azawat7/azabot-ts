import { Interaction } from "discord.js";
import { CustomBaseClient, BaseEvent } from "@/base";

export default class CommandInteractionCreateEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "interactionCreate");
  }
  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    const cmd = this.client.commands.get(interaction.commandName);
    if (!cmd) return;
    cmd.execute(interaction);
  }
}
