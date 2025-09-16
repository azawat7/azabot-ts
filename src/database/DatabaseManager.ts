import mongoose from "mongoose";
import { GuildMemberRepository } from "db/repositories/GuildMemberRepository";
import { GuildRepository } from "db/repositories/GuildRepository";

export class DatabaseManager {
  public guildMembers: GuildMemberRepository;
  public guilds: GuildRepository;

  constructor() {
    this.guildMembers = new GuildMemberRepository();
    this.guilds = new GuildRepository();
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log("✅ Connected to MongoDB");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}
