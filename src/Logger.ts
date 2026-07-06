import type { Context, otelLogsApi } from "../deps.ts";
import { isLevelEnabled, severityNumberFor } from "./severity.ts";
import type { LevelName } from "./severity.ts";

/**
 * Thin facade over an OTel `api-logs` `Logger`. Keeps the ergonomic
 * `debug/info/warn/error/critical(message)` surface while giving each call an
 * OTel-shaped `severityNumber`/`severityText`/`body` under the hood.
 */
export class Logger {
  readonly #otelLogger: otelLogsApi.Logger;
  readonly #name: string;
  readonly #level: LevelName;
  readonly #boundContext?: Context;

  constructor(
    otelLogger: otelLogsApi.Logger,
    name: string,
    level: LevelName,
    boundContext?: Context,
  ) {
    this.#otelLogger = otelLogger;
    this.#name = name;
    this.#level = level;
    this.#boundContext = boundContext;
  }

  get loggerName(): string {
    return this.#name;
  }

  get levelName(): LevelName {
    return this.#level;
  }

  /**
   * Returns a new `Logger` bound to `context` — every subsequent call on it
   * carries that context (e.g. an active span), so log records correlate
   * with a trace without any change to the `.debug()/.info()/...` call sites.
   */
  withContext(context: Context): Logger {
    return new Logger(this.#otelLogger, this.#name, this.#level, context);
  }

  debug(message: unknown, attributes?: Record<string, unknown>): void {
    this.#emit("DEBUG", message, attributes);
  }

  info(message: unknown, attributes?: Record<string, unknown>): void {
    this.#emit("INFO", message, attributes);
  }

  warn(message: unknown, attributes?: Record<string, unknown>): void {
    this.#emit("WARN", message, attributes);
  }

  error(message: unknown, attributes?: Record<string, unknown>): void {
    this.#emit("ERROR", message, attributes);
  }

  critical(message: unknown, attributes?: Record<string, unknown>): void {
    this.#emit("CRITICAL", message, attributes);
  }

  #emit(level: LevelName, message: unknown, attributes?: Record<string, unknown>): void {
    if (!isLevelEnabled(this.#level, level)) return;
    const body = message instanceof Error
      ? message.stack ?? message.message
      : typeof message === "string"
      ? message
      : String(message);
    this.#otelLogger.emit({
      severityNumber: severityNumberFor(level),
      severityText: level,
      body,
      attributes: attributes as otelLogsApi.LogAttributes | undefined,
      context: this.#boundContext,
    });
  }
}
