import { otelCore } from "../../deps.ts";
import type { LogRecordExporter, ReadableLogRecord } from "../../deps.ts";
import { toLogEntry } from "../types.ts";
import { plainTextFormatter } from "./formatters.ts";

export function createFileExporter(filename: string): LogRecordExporter {
  const file = Deno.openSync(filename, { create: true, append: true, write: true });
  const encoder = new TextEncoder();

  return {
    export(logs: ReadableLogRecord[], resultCallback) {
      try {
        for (const record of logs) {
          const entry = toLogEntry(record);
          file.writeSync(encoder.encode(plainTextFormatter(entry) + "\n"));
        }
        resultCallback({ code: otelCore.ExportResultCode.SUCCESS });
      } catch (error) {
        resultCallback({ code: otelCore.ExportResultCode.FAILED, error: error as Error });
      }
    },
    shutdown(): Promise<void> {
      file.close();
      return Promise.resolve();
    },
    forceFlush(): Promise<void> {
      return Promise.resolve();
    },
  };
}
