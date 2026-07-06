import { otelLogsSdk, otelResources } from "../deps.ts";
import type { LogRecordExporter } from "../deps.ts";
import { MultiplexingLogRecordProcessor } from "./MultiplexingLogRecordProcessor.ts";
import { Logger } from "./Logger.ts";
import type { LevelName } from "./severity.ts";
import { createConsoleExporter } from "./exporters/ConsoleLogRecordExporter.ts";

/**
 * Owns a `LoggerProvider` (OTel Logs SDK), a set of named exporters, and the
 * `Logger`s built from them. Each `LogManager` instance is independent, so
 * separate parts of an app (or separate packages) never collide on names.
 */
export class LogManager {
  #processor = new MultiplexingLogRecordProcessor();
  #provider: otelLogsSdk.LoggerProvider;
  #loggers = new Map<string, Logger>();

  constructor(serviceName = "@redvars/log") {
    this.#provider = new otelLogsSdk.LoggerProvider({
      resource: otelResources.resourceFromAttributes({ "service.name": serviceName }),
      processors: [this.#processor],
    });
  }

  /** Registers a named exporter for later use by `getLogger`. */
  registerHandler(name: string, exporter: LogRecordExporter): this {
    this.#processor.registerExporter(name, exporter);
    return this;
  }

  hasHandler(name: string): boolean {
    return this.#processor.hasExporter(name);
  }

  /**
   * Returns the logger for `name`, creating it on first call. `level` and
   * `handlerNames` are only used the first time a given logger name is
   * requested; subsequent calls return the cached instance.
   */
  getLogger(
    name: string,
    level: LevelName = "INFO",
    handlerNames: string[] = ["console"],
  ): Logger {
    const existing = this.#loggers.get(name);
    if (existing) return existing;

    this.#processor.setActiveExporters(name, handlerNames);
    const logger = new Logger(this.#provider.getLogger(name), name, level);
    this.#loggers.set(name, logger);
    return logger;
  }

  /**
   * Replaces the full set of active handlers for an already-created logger,
   * by name — e.g. to turn file logging off and database logging on at
   * runtime: `manager.setHandlers("MyService", ["console", "database"])`.
   */
  setHandlers(loggerName: string, handlerNames: string[]): void {
    this.#requireLogger(loggerName);
    this.#processor.setActiveExporters(loggerName, handlerNames);
  }

  /** Adds a handler (by name) to an already-created logger's active set, if not already present. */
  enableHandler(loggerName: string, handlerName: string): void {
    this.#requireLogger(loggerName);
    this.#processor.enableExporter(loggerName, handlerName);
  }

  /** Removes a handler (by name) from an already-created logger's active set, if present. */
  disableHandler(loggerName: string, handlerName: string): void {
    this.#requireLogger(loggerName);
    this.#processor.disableExporter(loggerName, handlerName);
  }

  /** Flushes/destroys every registered handler and shuts down the underlying LoggerProvider. */
  async destroy(): Promise<void> {
    await this.#provider.shutdown();
  }

  #requireLogger(loggerName: string): Logger {
    const logger = this.#loggers.get(loggerName);
    if (!logger) {
      throw new Error(
        `[@redvars/log] No logger created under name "${loggerName}". Call getLogger() first.`,
      );
    }
    return logger;
  }
}

export const defaultLogManager: LogManager = new LogManager();
defaultLogManager.registerHandler("console", createConsoleExporter());
