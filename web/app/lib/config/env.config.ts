import { logger } from "@shaw/utils";
import { config } from "dotenv";
config({ quiet: true });

interface WebEnvConfig {
  clientId: string;
  clientSecret: string;
  baseURL: string;
  authSecret: string;
  nodeEnv: "development" | "production";
}

function validateWebEnv(): WebEnvConfig {
  const required = {
    clientId: process.env.WEB_DISCORD_CLIENT_ID,
    clientSecret: process.env.WEB_DISCORD_CLIENT_SECRET,
    baseURL: process.env.WEB_BASE_URL,
    authSecret: process.env.WEB_AUTH_SECRET,
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

  return required as WebEnvConfig;
}

export const webEnv = validateWebEnv();
