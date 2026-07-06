import { otelCore } from "../../deps.ts";
import type { LogRecordExporter, ReadableLogRecord } from "../../deps.ts";
import { toLogEntry } from "../types.ts";
import { defaultFormatter } from "./formatters.ts";

const COLOR_BY_SEVERITY_TEXT: Record<string, string> = {
  INFO: "\x1b[34m%s\x1b[39m",
  WARN: "\x1b[33m%s\x1b[39m",
  ERROR: "\x1b[31m%s\x1b[39m",
  CRITICAL: "\x1b[1m\x1b[31m%s\x1b[39m\x1b[22m",
};

function applyColor(line: string, severityText: string, useColors: boolean): string {
  if (!useColors) return line;
  const template = COLOR_BY_SEVERITY_TEXT[severityText];
  return template ? template.replace("%s", line) : line;
}

export type TConsoleExporterOptions = {
  useColors?: boolean;
};

/**
 * Formats log entries the same human-readable way `logger-utils`/the old
 * `@std/log`-based handler did, unlike the OTel SDK's own `ConsoleLogRecordExporter`
 * (a diagnostic-only raw field dump not meant for stable output).
 */
export function createConsoleExporter(
  options: TConsoleExporterOptions = {},
): LogRecordExporter {
  const useColors = options.useColors ?? true;
  return {
    export(logs: ReadableLogRecord[], resultCallback) {
      for (const record of logs) {
        const entry = toLogEntry(record);
        console.log(applyColor(defaultFormatter(entry), entry.severityText, useColors));
      }
      resultCallback({ code: otelCore.ExportResultCode.SUCCESS });
    },
    shutdown(): Promise<void> {
      return Promise.resolve();
    },
    forceFlush(): Promise<void> {
      return Promise.resolve();
    },
  };
}
