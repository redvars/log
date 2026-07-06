import type { LogRecord } from "../../deps.ts";

// deno-lint-ignore no-control-regex
const ANSI_ESCAPE_PATTERN = new RegExp(
  "[\\x1b\\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
  "g",
);

export function defaultFormatter(record: LogRecord): string {
  return `[${record.datetime.toISOString()}] ${
    record.levelName.padEnd(7)
  } ${record.loggerName.padEnd(20)} ${record.msg}`;
}

export function plainTextFormatter(record: LogRecord): string {
  return defaultFormatter(record).replace(ANSI_ESCAPE_PATTERN, "");
}
