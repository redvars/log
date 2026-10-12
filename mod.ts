export { defaultLogManager, LogManager } from "./src/LogManager.js";
export { Logger } from "./src/Logger.js";
export type { LevelName } from "./src/severity.js";

export { createConsoleExporter } from "./src/exporters/ConsoleLogRecordExporter.js";
export type { TConsoleExporterOptions } from "./src/exporters/ConsoleLogRecordExporter.js";
export { createFileExporter } from "./src/exporters/FileLogRecordExporter.js";
export { DatabaseLogRecordExporter } from "./src/exporters/DatabaseLogRecordExporter.js";
export type { TDatabaseExporterOptions } from "./src/exporters/DatabaseLogRecordExporter.js";

export { defaultFormatter, plainTextFormatter } from "./src/exporters/formatters.js";

export { toLogEntry } from "./src/types.js";
export type { TLogEntry } from "./src/types.js";

// Re-exported for consumers writing their own exporters or wiring up
// context/span correlation (see README's "context propagation" section).
export type { Context, LogRecordExporter, ReadableLogRecord } from "./deps.js";
