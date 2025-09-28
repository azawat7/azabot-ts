import { IUser } from "@shaw/types";
import mongoose, { Schema } from "mongoose";

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

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
