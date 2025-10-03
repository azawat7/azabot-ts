import { Interaction } from "discord.js";
import { CustomClient, Event } from "@/structures";

export default class CommandInteractionCreateEvent extends Event {
  constructor(client: CustomClient) {
    super(client, "interactionCreate");
  }
  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    const cmd = this.client.commands.get(interaction.commandName);
    if (!cmd) return;
    cmd.execute(interaction);
  }
}
