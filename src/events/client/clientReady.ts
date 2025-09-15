import { CustomBaseClient, BaseEvent } from "@/base";

export default class ClientReadyEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "clientReady");
  }
  async run(): Promise<void> {
    console.log("✅ Logged in");
  }
}
