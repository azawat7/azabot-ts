import { Message } from "discord.js";
import { CustomBaseClient, BaseEvent } from "@/base";
import { logger } from "@shaw/utils";

export default class MessageCreateEvent extends BaseEvent {
  private readonly XP_MIN = 15;
  private readonly XP_MAX = 25;
  private readonly XP_COOLDOWN = 60000;

  constructor(client: CustomBaseClient) {
    super(client, "messageCreate");
  }

  async run(message: Message): Promise<void> {
    if (message.author.bot || !message.guild) return;

    try {
      const isOnCooldown = await this.client.db.guildMembers.isOnXPCooldown(
        message.guild.id,
        message.author.id,
        this.XP_COOLDOWN
      );
      if (isOnCooldown) return;

      const guildSettings = await this.client.db.guilds.getOrCreate(
        message.guild.id
      );

      const xpAmount =
        Math.floor(Math.random() * (this.XP_MAX - this.XP_MIN + 1)) +
        this.XP_MIN;
      const result = await this.client.db.guildMembers.addXP(
        message.guild.id,
        message.author.id,
        xpAmount,
        guildSettings.modules.levelModule.messageXp.messageXpFormula
      );
    } catch (error) {
      logger.error("messageCreate, xp:", error);
    }
  }
}
