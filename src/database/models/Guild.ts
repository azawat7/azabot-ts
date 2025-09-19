import { ILevelModule } from "@/types/settings.types";
import { Snowflake } from "discord.js";
import mongoose, { Document, Schema } from "mongoose";

export interface IGuildModules {
  levelModule: ILevelModule;
}

export interface IGuild extends Document {
  guildId: Snowflake;
  modules: IGuildModules;
  createdAt: Date;
  updatedAt: Date;
}

const GuildSchema = new Schema<IGuild>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    modules: {
      levelModule: {
        enabled: { type: Boolean, default: false },
        messageXpFormula: { type: String, default: "linear" },
        messageXpMin: { type: Number, default: 15 },
        messageXpMax: { type: Number, default: 25 },
        messageXpCooldown: { type: Number, default: 60000 },
        lvlUpMsgChannel: { type: String, default: "" },
        lvlUpMsgChannelType: { type: String, default: "current" },
        lvlUpMsgContent: { type: String, default: "Level up msg" },
        roleRewardsStack: { type: Boolean, default: false },
        roleRewardsArray: { type: Array, default: [] },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Guild = mongoose.model<IGuild>("Guild", GuildSchema);
