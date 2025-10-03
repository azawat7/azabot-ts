import { CustomClient, Event } from "@/structures";
import { logger } from "@shaw/utils";

export default class ClientReadyEvent extends Event {
  constructor(client: CustomClient) {
    super(client, "clientReady");
  }
  async run(): Promise<void> {
    logger.info("Logged in");
  }
}
