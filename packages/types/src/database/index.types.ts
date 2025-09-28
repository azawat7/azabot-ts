import { Snowflake } from "discord.js";
import { ModuleSettings } from "../modules/module-settings.types";
import { Document } from "mongoose";

export interface IGuild extends Document {
  guildId: Snowflake;
  modules: ModuleSettings;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
