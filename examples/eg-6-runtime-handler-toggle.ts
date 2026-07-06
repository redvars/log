import { createConsoleHandler, createFileHandler, DatabaseHandler, LogManager } from "../mod.ts";
import type { TLogEntry } from "../mod.ts";

class FakeDatabaseHandler extends DatabaseHandler {
  override async insertBatch(entries: TLogEntry[]): Promise<void> {
    await Promise.resolve();
    for (const entry of entries) {
      console.log(`[fake-db insert] ${entry.msg}`);
    }
  }
}

const manager = new LogManager();
manager.registerHandler("console", createConsoleHandler());
manager.registerHandler("file", createFileHandler("./app.log"));
manager.registerHandler("database", new FakeDatabaseHandler("INFO", { batchSize: 1 }));

// Starts out writing to console + file.
const logger = manager.getLogger("ToggleExample", "INFO", ["console", "file"]);
logger.info("this line goes to console + file");

// Flip at runtime: stop writing to file, start writing to the database —
// no new logger, no restart, the same `logger` reference keeps working.
manager.disableHandler("ToggleExample", "file");
manager.enableHandler("ToggleExample", "database");
logger.info("this line goes to console + database");

// Or replace the whole set in one call:
manager.setHandlers("ToggleExample", ["console"]);
logger.info("this line goes to console only");

await manager.destroy();
