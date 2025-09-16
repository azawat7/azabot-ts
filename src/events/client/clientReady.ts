import { CustomBaseClient, BaseEvent } from "@/base";
import { logger } from "@/utils/Logger";

export default class ClientReadyEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "clientReady");
  }
  async run(): Promise<void> {
    logger.info("Logged in");
  }
}
