import "dotenv/config";
import { CustomBaseClient } from "@/base";
import { logger } from "@shaw/utils";

function validateEnvironment() {
  const required = ["TOKEN", "MONGODB_URI", "GUILDID", "NODE_ENV"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error("Missing required environment variables:");
    missing.forEach((key) => logger.error(`- ${key}`));
    logger.error("Please check your .env file in the root directory");
    process.exit(1);
  }
}

async function startBot() {
  try {
    validateEnvironment();
    const Client = new CustomBaseClient();
    await Client.start();
  } catch (error) {
    logger.error("Error:", error);
    process.exit(1);
  }
}

startBot();
