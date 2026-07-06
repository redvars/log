import { log } from "../../deps.ts";
import type { LevelName, LogRecord } from "../../deps.ts";
import { toLogEntry } from "../types.ts";
import type { TLogEntry } from "../types.ts";

export type TDatabaseHandlerOptions = {
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
 * Base class for any handler that persists log entries to a database. Buffers
 * records and flushes them in batches via `insertBatch`, which subclasses
 * implement for their specific store (Postgres, an ORM, etc). Extends
 * `log.BaseHandler` fully overriding `handle()` since writes here are async,
 * unlike the synchronous `log()` contract the built-in handlers use.
 */
export abstract class DatabaseHandler extends log.BaseHandler {
  #buffer: TLogEntry[] = [];
  #timer?: number;
  #batchSize: number;
  #flushIntervalMs: number;
  #onError: (error: unknown, batch: TLogEntry[]) => void;

  constructor(levelName: LevelName, options: TDatabaseHandlerOptions = {}) {
    super(levelName);
    this.#batchSize = options.batchSize ?? 20;
    this.#flushIntervalMs = options.flushIntervalMs ?? 5000;
    this.#onError = options.onError ??
      ((error, batch) =>
        console.error(
          `[@redvars/log] DatabaseHandler failed to insert ${batch.length} log entr${
            batch.length === 1 ? "y" : "ies"
          }`,
          error,
        ));
  }

  override setup(): void {
    this.#timer = setInterval(() => {
      this.flush();
    }, this.#flushIntervalMs);
  }

  override handle(logRecord: LogRecord): void {
    if (this.level > logRecord.level) return;
    this.#buffer.push(toLogEntry(logRecord));
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

  override async destroy(): Promise<void> {
    clearInterval(this.#timer);
    await this.flush();
  }
}
