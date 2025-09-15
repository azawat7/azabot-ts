import { Snowflake } from "discord.js";
import mongoose, { Document, Schema } from "mongoose";

export interface IGuildMember extends Document {
  userId: Snowflake;
  guildId: Snowflake;
}

const GuildMemberSchema = new Schema<IGuildMember>(
  {
    userId: {
      type: String,
      required: true,
    },
    guildId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

GuildMemberSchema.index({ guildId: 1, userId: 1 }, { unique: true });
GuildMemberSchema.index({ userId: 1 });
GuildMemberSchema.index({ guildId: 1 });

export const GuildMember = mongoose.model<IGuildMember>(
  "GuildMember",
  GuildMemberSchema
);
