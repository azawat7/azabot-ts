import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  InteractionCallbackResponse,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  User,
} from "discord.js";
import { CustomBaseClient, BaseCommand } from "@/base";
import { LevelUtils } from "@/utils/LevelUtils";
import { CanvasRenderingContext2D, createCanvas, loadImage } from "canvas";
import { logger } from "@/utils/Logger";

const CANVAS_CONFIG = {
  width: 934,
  height: 282,
  backgroundColor: "#181920",
};

const AVATAR_CONFIG = {
  x: 38,
  y: 58,
  size: 166,
  borderRadius: 83,
  borderWidth: 5,
  outerSize: 172,
  outerBorderRadius: 86,
};

const PROGRESS_BAR_CONFIG = {
  x: 256,
  y: 182,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#383842",
};

const FONT_SIZES = {
  username: 45,
  xp: 26,
  levelLabel: 25,
  levelNumber: 61,
  rankLabel: 25,
  rankNumber: 61,
};

interface RankCardData {
  user: User;
  level: number;
  xp: number;
  rank: string;
  progressXP: number;
  totalXPNeeded: number;
  progressPercentage: number;
  accentColor: string;
}

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
    try {
      const targetUser =
        (interaction.options.get("user")?.user as User) || interaction.user;
      if (targetUser.bot)
        interaction.reply({
          content: `You can't use this command on a bot.`,
          flags: MessageFlags.Ephemeral,
        });
      const rankData = await this.getRankData(interaction, targetUser);
      const canvas = await this.createRankCard(rankData);

      const attachment = new AttachmentBuilder(canvas, {
        name: "rank-card.png",
      });

      const buttonId = "btn-rank-changeaccentcolor";
      const changeAccentColorButton = new ButtonBuilder()
        .setLabel("Change Accent Color")
        .setEmoji("✨")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(buttonId);
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
        changeAccentColorButton,
      ]);

      if (targetUser == interaction.user) {
        const response = await interaction.reply({
          files: [attachment],
          components: [actionRow],
          withResponse: true,
        });
        this.handleButton(interaction, response, buttonId);
      } else {
        await interaction.reply({
          files: [attachment],
        });
      }
    } catch (e) {
      logger.error("rankCmd :", e);
    }
  }

  private async getRankData(
    interaction: ChatInputCommandInteraction,
    targetUser: User
  ): Promise<RankCardData> {
    const guildSettings = await this.client.db.guilds.getOrCreate(
      interaction.guild?.id!
    );
    const levelModuleSettings = guildSettings.modules.levelModule;
    const guildMember = await this.client.db.guildMembers.getOrCreate(
      interaction.guild!.id,
      targetUser.id
    );
    const userData = await this.client.db.users.getOrCreate(targetUser.id);
    const memberRank = await this.client.db.guildMembers.getRank(
      interaction.guild!.id,
      targetUser.id
    );

    const currentLevelXP = LevelUtils.getXPForLevel(
      guildMember.level,
      levelModuleSettings.messageXpFormula
    );
    const nextLevelXP = LevelUtils.getXPForLevel(
      guildMember.level + 1,
      levelModuleSettings.messageXpFormula
    );
    const progressXP = guildMember.xp - currentLevelXP;
    const totalXPNeeded = nextLevelXP - currentLevelXP;
    const progressPercentage = LevelUtils.getLevelProgress(
      guildMember.xp,
      guildMember.level,
      levelModuleSettings.messageXpFormula
    );

    return {
      user: targetUser,
      level: guildMember.level,
      xp: guildMember.xp,
      rank: `#${memberRank}`,
      progressXP,
      totalXPNeeded,
      progressPercentage,
      accentColor: userData.rankAccentColor,
    };
  }

  private async createRankCard(data: RankCardData): Promise<Buffer> {
    const canvas = createCanvas(CANVAS_CONFIG.width, CANVAS_CONFIG.height);
    const ctx = canvas.getContext("2d");

    this.drawBackground(ctx);

    await this.drawAvatar(ctx, data.user, data.accentColor);

    this.drawUsername(ctx, data.user);
    this.drawXPText(ctx, data.progressXP, data.totalXPNeeded);
    this.drawLevel(ctx, data.level, data.accentColor);
    this.drawRank(ctx, data.rank, data.level);

    this.drawProgressBar(ctx, data.progressPercentage, data.accentColor);

    return canvas.toBuffer("image/png");
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = CANVAS_CONFIG.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);
  }

  private async drawAvatar(
    ctx: CanvasRenderingContext2D,
    user: User,
    accentColor: string
  ): Promise<void> {
    const avatarURL = user.displayAvatarURL({
      extension: "png",
      size: 256,
    });

    const avatar = await loadImage(avatarURL);

    // Draw avatar border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = AVATAR_CONFIG.borderWidth;
    ctx.beginPath();
    ctx.roundRect(
      AVATAR_CONFIG.x - 3,
      AVATAR_CONFIG.y - 3,
      AVATAR_CONFIG.outerSize,
      AVATAR_CONFIG.outerSize,
      AVATAR_CONFIG.outerBorderRadius
    );
    ctx.stroke();

    // Clip and draw avatar
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(
      AVATAR_CONFIG.x,
      AVATAR_CONFIG.y,
      AVATAR_CONFIG.size,
      AVATAR_CONFIG.size,
      AVATAR_CONFIG.borderRadius
    );
    ctx.clip();
    ctx.drawImage(
      avatar,
      AVATAR_CONFIG.x,
      AVATAR_CONFIG.y,
      AVATAR_CONFIG.size,
      AVATAR_CONFIG.size
    );
    ctx.restore();
  }

  private drawUsername(ctx: CanvasRenderingContext2D, user: User): void {
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.font = `${FONT_SIZES.username}px Arial`;
    ctx.fillText(user.displayName || user.username, 256, 164);
  }

  private drawXPText(
    ctx: CanvasRenderingContext2D,
    progressXP: number,
    totalXPNeeded: number
  ): void {
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.font = `${FONT_SIZES.xp}px Arial`;
    ctx.fillText(
      `${progressXP.toLocaleString()} / ${totalXPNeeded.toLocaleString()} XP`,
      CANVAS_CONFIG.width - 38,
      164
    );
  }

  private drawLevel(
    ctx: CanvasRenderingContext2D,
    level: number,
    accentColor: string
  ): void {
    const levelLabel = "LEVEL";
    const levelNumber = level.toString();

    ctx.fillStyle = accentColor;
    ctx.textAlign = "right";

    // Measure text widths
    ctx.font = `${FONT_SIZES.levelNumber}px Arial`;
    const levelNumberWidth = ctx.measureText(levelNumber).width;

    ctx.font = `${FONT_SIZES.levelLabel}px Arial`;
    const levelLabelWidth = ctx.measureText(levelLabel).width;

    // Draw level text
    const rightEdge = CANVAS_CONFIG.width - 38;
    ctx.font = `${FONT_SIZES.levelLabel}px Arial`;
    ctx.fillText(levelLabel, rightEdge - levelNumberWidth - 10, 103);

    ctx.font = `${FONT_SIZES.levelNumber}px Arial`;
    ctx.fillText(levelNumber, rightEdge, 103);
  }

  private drawRank(
    ctx: CanvasRenderingContext2D,
    rank: string,
    level: number
  ): void {
    const rankLabel = "RANK";

    ctx.fillStyle = "white";
    ctx.textAlign = "right";

    // Calculate level text total width
    ctx.font = `${FONT_SIZES.levelNumber}px Arial`;
    const levelNumberWidth = ctx.measureText(level.toString()).width;
    ctx.font = `${FONT_SIZES.levelLabel}px Arial`;
    const levelLabelWidth = ctx.measureText("LEVEL").width;
    const levelTotalWidth = levelNumberWidth + levelLabelWidth + 10;

    // Measure rank text widths
    ctx.font = `${FONT_SIZES.rankNumber}px Arial`;
    const rankNumberWidth = ctx.measureText(rank).width;

    // Draw rank text
    const rightEdge = CANVAS_CONFIG.width - 38 - levelTotalWidth - 20;
    ctx.font = `${FONT_SIZES.rankLabel}px Arial`;
    ctx.fillText(rankLabel, rightEdge - rankNumberWidth - 10, 103);

    ctx.font = `${FONT_SIZES.rankNumber}px Arial`;
    ctx.fillText(rank, rightEdge, 103);
  }

  private drawProgressBar(
    ctx: CanvasRenderingContext2D,
    progressPercentage: number,
    accentColor: string
  ): void {
    const progressBarWidth = CANVAS_CONFIG.width - 256 - 38;
    const filledWidth = progressBarWidth * progressPercentage;

    // Draw background
    ctx.fillStyle = PROGRESS_BAR_CONFIG.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(
      PROGRESS_BAR_CONFIG.x,
      PROGRESS_BAR_CONFIG.y,
      progressBarWidth,
      PROGRESS_BAR_CONFIG.height,
      PROGRESS_BAR_CONFIG.borderRadius
    );
    ctx.fill();

    // Draw progress fill
    if (filledWidth > 0) {
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(
        PROGRESS_BAR_CONFIG.x,
        PROGRESS_BAR_CONFIG.y,
        filledWidth,
        PROGRESS_BAR_CONFIG.height,
        PROGRESS_BAR_CONFIG.borderRadius
      );
      ctx.fill();
    }
  }

  private async handleButton(
    interaction: ChatInputCommandInteraction,
    response: InteractionCallbackResponse,
    buttonId: string
  ) {
    try {
      const buttonClick =
        await response.resource?.message?.awaitMessageComponent({
          filter: (i) => i.user.id === interaction.user.id,
          time: 20000,
        });
      if (buttonClick?.customId === buttonId) {
        const modal = this.createAccentColorModal();
        await buttonClick.showModal(modal);
        await response.resource?.message?.edit({
          components: [],
        });

        const modalSubmit = await buttonClick
          .awaitModalSubmit({
            time: 60000,
            filter: (i) => i.user.id === interaction.user.id,
          })
          .catch((e) => {
            logger.error(e);
            return null;
          });

        this.handleModal(interaction, modalSubmit);
      }
    } catch (e) {
      await response.resource?.message?.edit({
        components: [],
      });
    }
  }
  private async handleModal(
    interaction: ChatInputCommandInteraction,
    submitted: ModalSubmitInteraction | null
  ) {
    if (submitted) {
      const regex = /^#[0-9a-fA-F]{6}$/;
      const colorInput = submitted.fields.getTextInputValue("accentColorInput");

      if (regex.test(colorInput)) {
        this.client.db.users.updateAccentColor(interaction.user.id, colorInput);
        submitted.reply({
          content: `Successfully changed your accent color.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        submitted.reply({
          content: `Please input a valid hex color code.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }

  private createAccentColorModal(): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId("modal-rank-accent")
      .setTitle("Change your rank card's accent color");

    const accentColorInput = new TextInputBuilder()
      .setCustomId("accentColorInput")
      .setLabel("New accent color")
      .setRequired(true)
      .setStyle(TextInputStyle.Short)
      .setMinLength(7)
      .setMaxLength(7)
      .setPlaceholder("#ffffff");
    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      accentColorInput
    );
    modal.addComponents(actionRow);
    return modal;
  }
}
