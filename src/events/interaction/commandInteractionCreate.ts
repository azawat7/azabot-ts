import { Interaction } from "discord.js";
import BaseEvent from "@/base/BaseEvent";
import CustomBaseClient from "@/base/CustomBaseClient";

export default class CommandInteractionCreateEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "interactionCreate");
  }
  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) return;
    const cmd = this.client.commands.get(interaction.commandName);
    if (!cmd) return;
    cmd.run(interaction);
  }
}
