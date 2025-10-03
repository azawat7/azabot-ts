import { ClientEvents } from "discord.js";
import { CustomClient } from "@/structures";

export abstract class Event {
  constructor(public client: CustomClient, public name: keyof ClientEvents) {}
  abstract run(...args: any[]): Promise<void>;
}
