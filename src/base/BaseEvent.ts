import { ClientEvents } from "discord.js";
import CustomBaseClient from "@/base/CustomBaseClient";

export default abstract class BaseEvent {
  constructor(
    public client: CustomBaseClient,
    public name: keyof ClientEvents
  ) {}
  abstract run(...args: any[]): Promise<void>;
}
