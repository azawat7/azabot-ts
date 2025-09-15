import { Snowflake } from "discord.js";
import mongoose, { Document, Schema } from "mongoose";

export interface IGuild extends Document {
  guildId: Snowflake;
  createdAt: Date;
  updatedAt: Date;
}

const GuildSchema = new Schema<IGuild>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Guild = mongoose.model<IGuild>("Guild", GuildSchema);
