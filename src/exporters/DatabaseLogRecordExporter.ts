import { otelCore } from "../../deps.ts";
import type { LogRecordExporter, ReadableLogRecord } from "../../deps.ts";
import { toLogEntry } from "../types.ts";
import type { TLogEntry } from "../types.ts";

export type TDatabaseExporterOptions = {
  /** Flush once the buffer reaches this many entries. Default 20. */
  batchSize?: number;
  /** Flush on a timer regardless of buffer size, in milliseconds. Default 5000. */
  flushIntervalMs?: number;
  /**
   * Called when `insertBatch` throws. Defaults to `console.error` — a failing
   * log sink must never crash the host application.
   */
  onError?: (error: unknown, batch: TLogEntry[]) => void;
};

/**
 * Base class for any exporter that persists log entries to a database.
 * Buffers records and flushes them in batches via `insertBatch`, which
 * subclasses implement for their specific store (Postgres, an ORM, etc).
 * Deliberately DB-agnostic — no dependency on any particular driver or ORM.
 */
export abstract class DatabaseLogRecordExporter implements LogRecordExporter {
  #buffer: TLogEntry[] = [];
  #timer: number;
  #batchSize: number;
  #onError: (error: unknown, batch: TLogEntry[]) => void;

  constructor(options: TDatabaseExporterOptions = {}) {
    this.#batchSize = options.batchSize ?? 20;
    this.#onError = options.onError ??
      ((error, batch) =>
        console.error(
          `[@redvars/log] DatabaseLogRecordExporter failed to insert ${batch.length} log entr${
            batch.length === 1 ? "y" : "ies"
          }`,
          error,
        ));
    this.#timer = setInterval(() => {
      this.flush();
    }, options.flushIntervalMs ?? 5000);
  }

  export(logs: ReadableLogRecord[], resultCallback: (result: otelCore.ExportResult) => void): void {
    for (const record of logs) {
      this.#buffer.push(toLogEntry(record));
    }
    resultCallback({ code: otelCore.ExportResultCode.SUCCESS });
    if (this.#buffer.length >= this.#batchSize) {
      this.flush();
    }
  }

  /** Flushes any buffered entries immediately. Safe to call manually. */
  async flush(): Promise<void> {
    if (this.#buffer.length === 0) return;
    const batch = this.#buffer.splice(0, this.#buffer.length);
    try {
      await this.insertBatch(batch);
    } catch (error) {
      this.#onError(error, batch);
    }
  }

  /** Persist a batch of log entries. Implement this for your database/client of choice. */
  abstract insertBatch(entries: TLogEntry[]): Promise<void>;

  async forceFlush(): Promise<void> {
    await this.flush();
  }

  async shutdown(): Promise<void> {
    clearInterval(this.#timer);
    await this.flush();
  }
}
