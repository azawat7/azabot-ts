import { ISession } from "@shaw/types";
import mongoose, { Schema } from "mongoose";

const SessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    discordAccessToken: {
      type: String,
      required: true,
    },
    discordRefreshToken: {
      type: String,
      required: true,
    },
    discordTokenExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

SessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const Session =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
