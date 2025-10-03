import {
  Client,
  ClientEvents,
  Collection,
  Partials,
  SlashCommandBuilder,
} from "discord.js";
import { glob } from "glob";
import { Command, Event } from "@/structures";
import { DatabaseManager } from "@shaw/database";
import { logger } from "@shaw/utils";
import path from "path";
import { env } from "@/config";

export class CustomClient extends Client {
  commands: Collection<String, Command>;
  events: Collection<keyof ClientEvents, Event>;
  db: DatabaseManager;
  constructor() {
    super({
      intents: 3276799,
      partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember,
      ],
    });
    this.commands = new Collection();
    this.events = new Collection();
    this.db = DatabaseManager.getInstance();
  }
  async start() {
    await this.db.connect();
    await this.loadEvents();
    await this.loadCommands();
    await this.login(env.token);
  }

  private getFileExtension(): string {
    return env.nodeEnv === "production" ? "js" : "ts";
  }

  private async loadModule(fullPath: string): Promise<any> {
    try {
      if (env.nodeEnv !== "production") {
        delete require.cache[require.resolve(fullPath)];
      }
      const module = require(fullPath);
      return module.default || module;
    } catch (error) {
      const module = await import(fullPath);
      return module.default || module;
    }
  }

  private async loadCommands() {
    const slashCommands: SlashCommandBuilder[] = [];
    const fileExtension = this.getFileExtension();
    const commandFiles = await glob(`commands/**/*.${fileExtension}`, {
      cwd: path.join(__dirname, ".."),
    });

    for (const file of commandFiles) {
      try {
        const fullPath = path.join(__dirname, "..", file);
        const CommandClass = await this.loadModule(fullPath);
        const command = new CommandClass(this) as Command;
        this.commands.set(command.commandInfo.name, command);
        slashCommands.push(command.commandInfo);
      } catch (error) {
        logger.error(`Failed to load command ${file}:`, error);
      }
    }

    this.once("clientReady", async () => {
      const guild = this.guilds.cache.get(env.guildId)!;
      await guild.commands.set(slashCommands);
    });

    logger.info(`${this.commands.size} Slash Commands loaded`);
  }

  private async loadEvents() {
    const fileExtension = this.getFileExtension();
    const eventFiles = await glob(`events/**/*.${fileExtension}`, {
      cwd: path.join(__dirname, ".."),
    });

    for (const file of eventFiles) {
      try {
        const fullPath = path.join(__dirname, "..", file);
        const EventClass = await this.loadModule(fullPath);
        const event = new EventClass(this) as Event;
        this.events.set(event.name, event);
        this.on(event.name, (...args) => event.run(...args));
      } catch (error) {
        logger.error(`Failed to load event ${file}:`, error);
      }
    }

    logger.info(`${this.events.size} Events loaded`);
  }
}
