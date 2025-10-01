import { DatabaseManager, ScheduledTasks } from "@shaw/database";
import { logger } from "@shaw/utils";

export async function register() {
  const db = DatabaseManager.getInstance();
  await db.ensureConnection();
  ScheduledTasks.startAll().catch((error) => {
    logger.error("Failed to start scheduled tasks:", error);
  });
}
