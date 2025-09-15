import BaseEvent from "@/base/BaseEvent";
import CustomBaseClient from "@/base/CustomBaseClient";

export default class ClientReadyEvent extends BaseEvent {
  constructor(client: CustomBaseClient) {
    super(client, "clientReady");
  }
  async run(): Promise<void> {
    console.log("✅ Logged in");
  }
}
