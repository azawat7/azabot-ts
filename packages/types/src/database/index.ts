import { Snowflake } from "discord.js";
import { Document } from "mongoose";
import { ModuleSettings } from "../config/types";

export interface IGuild extends Document {
  guildId: Snowflake;
  modules: ModuleSettings;
  disabledCommands: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuildMember extends Document {
  userId: Snowflake;
  guildId: Snowflake;
  xp: number;
  level: number;
  lastXPGain: Date;
}

export interface IUser extends Document {
  userId: Snowflake;
  rankAccentColor: string;
}

export interface ISession extends Document {
  sessionId: string;
  userId: Snowflake;
  discordAccessToken: string;
  discordRefreshToken: string;
  discordTokenExpiry: Date;
  createdAt: Date;
  updatedAt: Date;
}
