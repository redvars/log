import type { TLogEntry } from "../types.ts";

// deno-lint-ignore no-control-regex
const ANSI_ESCAPE_PATTERN = new RegExp(
  "[\\x1b\\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
  "g",
);

export function defaultFormatter(entry: TLogEntry): string {
  return `[${entry.timestamp.toISOString()}] ${
    entry.severityText.padEnd(7)
  } ${entry.loggerName.padEnd(20)} ${entry.body}`;
}

export function plainTextFormatter(entry: TLogEntry): string {
  return defaultFormatter(entry).replace(ANSI_ESCAPE_PATTERN, "");
}
