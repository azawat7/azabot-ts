import { logger } from "@shaw/utils";
import { config } from "dotenv";
config({ quiet: true });

interface BotEnvConfig {
  token: string;
  guildId: string;
  mongodbUri: string;
  nodeEnv: "development" | "production";
}

function validateBotEnv(): BotEnvConfig {
  const required = {
    token: process.env.BOT_TOKEN,
    guildId: process.env.BOT_GUILDID,
    nodeEnv: process.env.NODE_ENV,
  };

  const missing: string[] = [];

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logger.error("Missing required environment variables:");
    missing.forEach((key) => logger.error(`- ${key.toUpperCase()}`));
    logger.error("Please check your .env file");
    process.exit(1);
  }

  return required as BotEnvConfig;
}

export const botEnv = validateBotEnv();
