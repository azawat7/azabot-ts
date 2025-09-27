import {
  Client,
  ClientEvents,
  Collection,
  Partials,
  SlashCommandBuilder,
} from "discord.js";
import { glob } from "glob";
import { BaseCommand, BaseEvent } from "@/base";
import { DatabaseManager } from "@shaw/database";
import { logger } from "@shaw/utils";
import path from "path";

export class CustomBaseClient extends Client {
  commands: Collection<String, BaseCommand>;
  events: Collection<keyof ClientEvents, BaseEvent>;
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
    this.db = new DatabaseManager();
  }
  async start() {
    await this.db.connect();
    await this.loadEvents();
    await this.loadCommands();
    await this.login(process.env.TOKEN);
  }

  // TODO MAKE IT DEV ENV COMPATIBLE

  private async loadCommands() {
    const slashCommands: SlashCommandBuilder[] = [];

    const commandFiles = await glob("commands/**/*.js", {
      cwd: path.join(__dirname, ".."),
    });

    for (const file of commandFiles) {
      try {
        const fullPath = path.join(__dirname, "..", file);
        const CommandClass = require(fullPath).default;
        const command = new CommandClass(this) as BaseCommand;
        this.commands.set(command.commandInfo.name, command);
        slashCommands.push(command.commandInfo);
      } catch (error) {
        logger.error(`Failed to load command ${file}:`, error);
      }
    }

    this.once("clientReady", async () => {
      const guild = this.guilds.cache.get(process.env.GUILDID!)!;
      await guild.commands.set(slashCommands);
    });

    logger.info(`${this.commands.size} Slash Commands loaded`);
  }

  private async loadEvents() {
    const eventFiles = await glob("events/**/*.js", {
      cwd: path.join(__dirname, ".."),
    });

    for (const file of eventFiles) {
      try {
        const fullPath = path.join(__dirname, "..", file);
        const EventClass = require(fullPath).default;
        const event = new EventClass(this) as BaseEvent;
        this.events.set(event.name, event);
        this.on(event.name, (...args) => event.run(...args));
      } catch (error) {
        logger.error(`Failed to load event ${file}:`, error);
      }
    }

    logger.info(`${this.events.size} Events loaded`);
  }
}
