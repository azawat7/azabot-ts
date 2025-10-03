import { logger } from "@shaw/utils";
import { config } from "dotenv";
config({ quiet: true });

interface DatabaseEnvConfig {
  mongodbUri: string;
  redisUrl: string;
}

function validateDatabaseEnv(): DatabaseEnvConfig {
  const required = {
    mongodbUri: process.env.DB_MONGODB_URI,
    redisUrl: process.env.DB_REDIS_URL,
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

  return required as DatabaseEnvConfig;
}

export const databaseEnv = validateDatabaseEnv();
