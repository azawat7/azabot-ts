import { CustomBaseClient } from "@/base";
import { logger } from "@shaw/utils";

async function startBot() {
  try {
    const Client = new CustomBaseClient();
    await Client.start();
  } catch (error) {
    logger.error("Error:", error);
    process.exit(1);
  }
}

startBot();
