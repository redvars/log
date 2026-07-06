import { DatabaseHandler, LogManager } from "../mod.ts";
import type { TLogEntry } from "../mod.ts";

/**
 * Illustrative only — this file does NOT import `@redvars/orm` (this package
 * has zero dependency on it, and never will, to avoid a package cycle since
 * `@redvars/orm` itself depends on `@redvars/log`). It documents the shape
 * you'd write in a project that already has an ORM `client`:
 *
 * ```ts
 * import { ORM } from "@redvars/orm";
 * import { DatabaseHandler } from "@redvars/log";
 * import type { TLogEntry } from "@redvars/log";
 *
 * class OrmDatabaseHandler extends DatabaseHandler {
 *   #client: ORMClient;
 *   constructor(client: ORMClient, levelName: LevelName, options?: TDatabaseHandlerOptions) {
 *     super(levelName, options);
 *     this.#client = client;
 *   }
 *
 *   override async insertBatch(entries: TLogEntry[]): Promise<void> {
 *     const logsTable = this.#client.table("logs");
 *     for (const entry of entries) {
 *       const record = logsTable.createNewRecord();
 *       record.set("datetime", entry.datetime);
 *       record.set("level", entry.levelName);
 *       record.set("logger_name", entry.loggerName);
 *       record.set("message", entry.msg);
 *       await record.insert();
 *     }
 *   }
 * }
 * ```
 *
 * The stand-in class below runs standalone so this example is executable
 * without a real database.
 */
class StandInOrmDatabaseHandler extends DatabaseHandler {
  override async insertBatch(entries: TLogEntry[]): Promise<void> {
    await Promise.resolve();
    console.log(`Would insert ${entries.length} log row(s) via @redvars/orm`);
  }
}

const manager = new LogManager();
manager.registerHandler("database", new StandInOrmDatabaseHandler("INFO"));
const logger = manager.getLogger("OrmIntegrationExample", "INFO", ["database"]);

logger.info("order placed");
await manager.destroy();
