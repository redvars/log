export { defaultLogManager, LogManager } from "./src/LogManager.ts";
export { Logger } from "./src/Logger.ts";
export type { LevelName } from "./src/severity.ts";

export { createConsoleExporter } from "./src/exporters/ConsoleLogRecordExporter.ts";
export type { TConsoleExporterOptions } from "./src/exporters/ConsoleLogRecordExporter.ts";
export { createFileExporter } from "./src/exporters/FileLogRecordExporter.ts";
export { DatabaseLogRecordExporter } from "./src/exporters/DatabaseLogRecordExporter.ts";
export type { TDatabaseExporterOptions } from "./src/exporters/DatabaseLogRecordExporter.ts";

export { defaultFormatter, plainTextFormatter } from "./src/exporters/formatters.ts";

export { toLogEntry } from "./src/types.ts";
export type { TLogEntry } from "./src/types.ts";

// Re-exported for consumers writing their own exporters or wiring up
// context/span correlation (see README's "context propagation" section).
export type { Context, LogRecordExporter, ReadableLogRecord } from "./deps.ts";
