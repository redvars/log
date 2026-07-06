import { DatabaseHandler, LogManager } from "../mod.ts";
import type { TLogEntry } from "../mod.ts";

// A DatabaseHandler is DB-agnostic: extend it and implement `insertBatch` for
// whatever store you're using. This example uses a fake async client so it
// runs standalone; swap the body of `insertBatch` for your real driver
// (pg, sqlite, an ORM, an HTTP log-ingestion endpoint, etc).
class FakeClientDatabaseHandler extends DatabaseHandler {
  override async insertBatch(entries: TLogEntry[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10)); // pretend network call
    for (const entry of entries) {
      console.log(`[fake-db insert] ${entry.levelName} ${entry.loggerName}: ${entry.msg}`);
    }
  }
}

const manager = new LogManager();
manager.registerHandler(
  "database",
  new FakeClientDatabaseHandler("INFO", { batchSize: 3, flushIntervalMs: 2000 }),
);
const logger = manager.getLogger("DatabaseExample", "INFO", ["database"]);

logger.info("user signed up");
logger.info("user upgraded plan");
logger.info("user invited a teammate"); // triggers an automatic flush (batchSize: 3)

// Anything still buffered is flushed here, and the flush timer is stopped.
await manager.destroy();
