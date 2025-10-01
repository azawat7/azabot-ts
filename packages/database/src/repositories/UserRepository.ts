import { IUser } from "@shaw/types";
import { Snowflake } from "discord.js";
import { BaseRepository } from "./BaseRepository";
import { User } from "../models/User";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async getOrCreate(userId: Snowflake): Promise<IUser> {
    const result = await this.findOne({ userId });
    if (!result) return await this.create({ userId });
    return result;
  }

  async updateAccentColor(
    userId: Snowflake,
    accentColor: string
  ): Promise<IUser | null> {
    return await this.updateOne({ userId }, { rankAccentColor: accentColor });
  }
}
