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
    const errorMessage = `Missing required environment variables:\n${missing
      .map((key) => `- ${key.toUpperCase()}`)
      .join("\n")}\nPlease check your .env file`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return required as BotEnvConfig;
}

export const botEnv = validateBotEnv();
