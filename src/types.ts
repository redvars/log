import { otelCore } from "../deps.ts";
import type { ReadableLogRecord } from "../deps.ts";

/** A single log entry handed to a {@link DatabaseLogRecordExporter} subclass. */
export type TLogEntry = {
  timestamp: Date;
  severityNumber: number;
  severityText: string;
  loggerName: string;
  body: string;
  attributes: Record<string, unknown>;
};

export function toLogEntry(record: ReadableLogRecord): TLogEntry {
  return {
    timestamp: new Date(otelCore.hrTimeToMilliseconds(record.hrTime)),
    severityNumber: record.severityNumber ?? 0,
    severityText: record.severityText ?? "UNKNOWN",
    loggerName: record.instrumentationScope.name,
    body: typeof record.body === "string" ? record.body : String(record.body ?? ""),
    attributes: { ...record.attributes },
  };
}
