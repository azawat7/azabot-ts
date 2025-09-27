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

  private async loadCommands() {
    const commandFiles = await glob("./src/commands/**/*.ts");
    const slashCommands: SlashCommandBuilder[] = [];

    for (let filePath of commandFiles) {
      const pathParts = filePath.split("\\");
      const commandPath = `../commands/${pathParts[pathParts.length - 2]}/${
        pathParts[pathParts.length - 1]
      }`;

      const CommandClass = require(commandPath).default;
      const CommandInstance: BaseCommand = new CommandClass(this);

      this.commands.set(CommandInstance.commandInfo.name, CommandInstance);
      slashCommands.push(CommandInstance.commandInfo);
    }

    this.on("clientReady", async () => {
      const guild = this.guilds.cache.get(process.env.GUILDID!);
      if (guild) await guild.commands.set(slashCommands);
    });

    logger.info(`${this.commands.size} Slash Commands loaded`);
  }

  private async loadEvents() {
    const eventFiles = await glob("./src/events/**/*.ts");

    for (let filePath of eventFiles) {
      const pathParts = filePath.split("\\");
      const eventPath = `../events/${pathParts[pathParts.length - 2]}/${
        pathParts[pathParts.length - 1]
      }`;

      const EventClass = require(eventPath).default;
      const EventInstance: BaseEvent = new EventClass(this);

      this.events.set(EventInstance.name, EventInstance);

      this.on(EventInstance.name, (...args) => EventInstance.run(...args));
    }
    logger.info(`${this.events.size} Events loaded`);
  }
}
