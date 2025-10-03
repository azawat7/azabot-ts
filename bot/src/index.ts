import { CustomClient } from "@/structures";
import { logger } from "@shaw/utils";

async function startBot() {
  try {
    const Client = new CustomClient();
    await Client.start();
  } catch (error) {
    logger.error("Error:", error);
    process.exit(1);
  }
}

startBot();
