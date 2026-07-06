import { DatabaseLogRecordExporter, LogManager } from "../mod.ts";
import type { TLogEntry } from "../mod.ts";

// DatabaseLogRecordExporter is DB-agnostic: extend it and implement
// `insertBatch` for whatever store you're using. This example uses a fake
// async client so it runs standalone; swap the body of `insertBatch` for
// your real driver (pg, sqlite, an ORM, an HTTP log-ingestion endpoint, etc).
class FakeClientDatabaseExporter extends DatabaseLogRecordExporter {
  override async insertBatch(entries: TLogEntry[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10)); // pretend network call
    for (const entry of entries) {
      console.log(`[fake-db insert] ${entry.severityText} ${entry.loggerName}: ${entry.body}`);
    }
  }
}

const manager = new LogManager();
manager.registerHandler(
  "database",
  new FakeClientDatabaseExporter({ batchSize: 3, flushIntervalMs: 2000 }),
);
const logger = manager.getLogger("DatabaseExample", "INFO", ["database"]);

logger.info("user signed up");
logger.info("user upgraded plan");
logger.info("user invited a teammate"); // triggers an automatic flush (batchSize: 3)

// Anything still buffered is flushed here, and the flush timer is stopped.
await manager.destroy();
