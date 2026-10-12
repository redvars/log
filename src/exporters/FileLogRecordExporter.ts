import { closeSync, openSync, writeSync } from "node:fs";
import { otelCore } from "../../deps.js";
import type { LogRecordExporter, ReadableLogRecord } from "../../deps.js";
import { toLogEntry } from "../types.js";
import { plainTextFormatter } from "./formatters.js";

export function createFileExporter(filename: string): LogRecordExporter {
  const fd = openSync(filename, "a");

  return {
    export(logs: ReadableLogRecord[], resultCallback) {
      try {
        for (const record of logs) {
          const entry = toLogEntry(record);
          writeSync(fd, plainTextFormatter(entry) + "\n");
        }
        resultCallback({ code: otelCore.ExportResultCode.SUCCESS });
      } catch (error) {
        resultCallback({ code: otelCore.ExportResultCode.FAILED, error: error as Error });
      }
    },
    shutdown(): Promise<void> {
      closeSync(fd);
      return Promise.resolve();
    },
    forceFlush(): Promise<void> {
      return Promise.resolve();
    },
  };
}
