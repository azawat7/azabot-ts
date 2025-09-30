import { IGuildMember } from "@shaw/types";
import mongoose, { Schema } from "mongoose";

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
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    lastXPGain: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

GuildMemberSchema.index({ guildId: 1, userId: 1 }, { unique: true });
GuildMemberSchema.index({ userId: 1 });
GuildMemberSchema.index({ guildId: 1 });
GuildMemberSchema.index({ guildId: 1, xp: -1 });
GuildMemberSchema.index({ guildId: 1, xp: 1 });

export const GuildMember =
  mongoose.models.GuildMember ||
  mongoose.model<IGuildMember>("GuildMember", GuildMemberSchema);
