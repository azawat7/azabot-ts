import { logger } from "@shaw/utils";
import { config } from "dotenv";
config({ quiet: true });

interface DatabaseEnvConfig {
  mongodbUri: string;
}

function validateDatabaseEnv(): DatabaseEnvConfig {
  const required = {
    mongodbUri: process.env.DB_MONGODB_URI,
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

  return required as DatabaseEnvConfig;
}

export const databaseEnv = validateDatabaseEnv();
