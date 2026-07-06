import { DatabaseLogRecordExporter, LogManager } from "../mod.ts";
import type { TLogEntry } from "../mod.ts";

/**
 * Illustrative only — this file does NOT import `@redvars/orm`, to keep the
 * dependency direction one-way (`@redvars/orm` depends on `@redvars/log`,
 * never the other way around). It documents the shape you'd write in a
 * project that already has an ORM `client`:
 *
 * ```ts
 * import { ORM } from "@redvars/orm";
 * import { DatabaseLogRecordExporter } from "@redvars/log";
 * import type { TLogEntry } from "@redvars/log";
 *
 * class OrmDatabaseExporter extends DatabaseLogRecordExporter {
 *   #client: ORMClient;
 *   constructor(client: ORMClient, options?: TDatabaseExporterOptions) {
 *     super(options);
 *     this.#client = client;
 *   }
 *
 *   override async insertBatch(entries: TLogEntry[]): Promise<void> {
 *     const logsTable = this.#client.table("logs");
 *     for (const entry of entries) {
 *       const record = logsTable.createNewRecord();
 *       record.set("timestamp", entry.timestamp);
 *       record.set("severity", entry.severityText);
 *       record.set("logger_name", entry.loggerName);
 *       record.set("message", entry.body);
 *       await record.insert();
 *     }
 *   }
 * }
 * ```
 *
 * The stand-in class below runs standalone so this example is executable
 * without a real database.
 */
class StandInOrmDatabaseExporter extends DatabaseLogRecordExporter {
  override async insertBatch(entries: TLogEntry[]): Promise<void> {
    await Promise.resolve();
    console.log(`Would insert ${entries.length} log row(s) via @redvars/orm`);
  }
}

const manager = new LogManager();
manager.registerHandler("database", new StandInOrmDatabaseExporter());
const logger = manager.getLogger("OrmIntegrationExample", "INFO", ["database"]);

logger.info("order placed");
await manager.destroy();
