export { defaultLogManager, LogManager } from "./src/LogManager.ts";

export { createConsoleHandler } from "./src/handlers/ConsoleHandler.ts";
export { createFileHandler } from "./src/handlers/FileHandler.ts";
export { DatabaseHandler } from "./src/handlers/DatabaseHandler.ts";
export type { TDatabaseHandlerOptions } from "./src/handlers/DatabaseHandler.ts";

export { defaultFormatter, plainTextFormatter } from "./src/handlers/formatters.ts";

export type { TLogEntry } from "./src/types.ts";

export { log } from "./deps.ts";
export type {
  BaseHandlerOptions,
  ConsoleHandlerOptions,
  FileHandlerOptions,
  LevelName,
  Logger,
  LogRecord,
} from "./deps.ts";
