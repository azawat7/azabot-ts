import { CustomBaseClient, BaseEvent } from "@/base";
import { logger } from "@shaw/utils";

export default class ClientReadyEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "clientReady");
  }
  async run(): Promise<void> {
    logger.info("Logged in");
  }
}
