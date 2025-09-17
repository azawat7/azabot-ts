import { Snowflake } from "discord.js";
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  userId: Snowflake;
  rankAccentColor: string;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    rankAccentColor: {
      type: String,
      default: "#5865F2",
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
