import { otelCore } from "../deps.ts";
import type { Context, LogRecordExporter, LogRecordProcessor, SdkLogRecord } from "../deps.ts";

/**
 * The one real `LogRecordProcessor` registered with a `LoggerProvider`.
 *
 * OTel's `LoggerProvider` fixes its processors at construction time — there's
 * no public API to add or remove one later. To support turning sinks on/off
 * at runtime (`LogManager.setHandlers`/`enableHandler`/`disableHandler`), this
 * processor owns its own mutable routing table instead: a named registry of
 * exporters, and a per-logger-name (`instrumentationScope.name`) set of which
 * exporter names are currently active for it.
 */
export class MultiplexingLogRecordProcessor implements LogRecordProcessor {
  #exporters = new Map<string, LogRecordExporter>();
  #activeByScope = new Map<string, Set<string>>();

  registerExporter(name: string, exporter: LogRecordExporter): void {
    this.#exporters.set(name, exporter);
  }

  hasExporter(name: string): boolean {
    return this.#exporters.has(name);
  }

  requireExporter(name: string): LogRecordExporter {
    const exporter = this.#exporters.get(name);
    if (!exporter) {
      throw new Error(
        `[@redvars/log] No handler registered under name "${name}". Call registerHandler() first.`,
      );
    }
    return exporter;
  }

  setActiveExporters(scopeName: string, exporterNames: string[]): void {
    for (const name of exporterNames) this.requireExporter(name);
    this.#activeByScope.set(scopeName, new Set(exporterNames));
  }

  hasActiveExporters(scopeName: string): boolean {
    return this.#activeByScope.has(scopeName);
  }

  enableExporter(scopeName: string, exporterName: string): void {
    this.requireExporter(exporterName);
    const active = this.#activeByScope.get(scopeName);
    if (!active) {
      throw new Error(
        `[@redvars/log] No logger created under name "${scopeName}". Call getLogger() first.`,
      );
    }
    active.add(exporterName);
  }

  disableExporter(scopeName: string, exporterName: string): void {
    const active = this.#activeByScope.get(scopeName);
    if (!active) {
      throw new Error(
        `[@redvars/log] No logger created under name "${scopeName}". Call getLogger() first.`,
      );
    }
    active.delete(exporterName);
  }

  onEmit(logRecord: SdkLogRecord, _context?: Context): void {
    const active = this.#activeByScope.get(logRecord.instrumentationScope.name);
    if (!active || active.size === 0) return;
    for (const name of active) {
      const exporter = this.#exporters.get(name);
      if (!exporter) continue;
      exporter.export([logRecord], (result) => {
        if (result.code === otelCore.ExportResultCode.FAILED) {
          console.error(`[@redvars/log] exporter "${name}" failed to export a log record`, result.error);
        }
      });
    }
  }

  async forceFlush(): Promise<void> {
    await Promise.all(
      Array.from(this.#exporters.values()).map((exporter) => exporter.forceFlush()),
    );
  }

  async shutdown(): Promise<void> {
    await Promise.all(
      Array.from(this.#exporters.values()).map((exporter) => exporter.shutdown()),
    );
  }
}
