import { log } from "../deps.ts";
import type { LevelName } from "../deps.ts";
import { createConsoleHandler } from "./handlers/ConsoleHandler.ts";

/**
 * Owns a set of named handlers and the loggers built from them. Unlike
 * `@std/log`'s global `log.setup()` registry, each `LogManager` instance is
 * independent, so separate parts of an app (or separate packages) never
 * collide on handler/logger names.
 */
export class LogManager {
  #handlers = new Map<string, log.BaseHandler>();
  #loggers = new Map<string, log.Logger>();

  /** Registers (and initializes) a handler under `name` for later use by `getLogger`. */
  registerHandler(name: string, handler: log.BaseHandler): this {
    handler.setup();
    this.#handlers.set(name, handler);
    return this;
  }

  hasHandler(name: string): boolean {
    return this.#handlers.has(name);
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
  ): log.Logger {
    const existing = this.#loggers.get(name);
    if (existing) return existing;

    const logger = new log.Logger(name, level, {
      handlers: this.#resolveHandlers(handlerNames),
    });
    this.#loggers.set(name, logger);
    return logger;
  }

  /**
   * Replaces the full set of active handlers for an already-created logger,
   * by name — e.g. to turn file logging off and database logging on at
   * runtime: `manager.setHandlers("MyService", ["console", "database"])`.
   */
  setHandlers(loggerName: string, handlerNames: string[]): void {
    this.#requireLogger(loggerName).handlers = this.#resolveHandlers(
      handlerNames,
    );
  }

  /** Adds a handler (by name) to an already-created logger's active set, if not already present. */
  enableHandler(loggerName: string, handlerName: string): void {
    const logger = this.#requireLogger(loggerName);
    const handler = this.#requireHandler(handlerName);
    if (!logger.handlers.includes(handler)) {
      logger.handlers = [...logger.handlers, handler];
    }
  }

  /** Removes a handler (by name) from an already-created logger's active set, if present. */
  disableHandler(loggerName: string, handlerName: string): void {
    const logger = this.#requireLogger(loggerName);
    const handler = this.#handlers.get(handlerName);
    logger.handlers = logger.handlers.filter((h) => h !== handler);
  }

  /** Flushes/destroys every registered handler (e.g. before process exit). */
  async destroy(): Promise<void> {
    for (const handler of this.#handlers.values()) {
      await handler.destroy();
    }
  }

  #resolveHandlers(handlerNames: string[]): log.BaseHandler[] {
    return handlerNames.map((handlerName) => this.#requireHandler(handlerName));
  }

  #requireHandler(handlerName: string): log.BaseHandler {
    const handler = this.#handlers.get(handlerName);
    if (!handler) {
      throw new Error(
        `[@redvars/log] No handler registered under name "${handlerName}". Call registerHandler() first.`,
      );
    }
    return handler;
  }

  #requireLogger(loggerName: string): log.Logger {
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
defaultLogManager.registerHandler("console", createConsoleHandler());
