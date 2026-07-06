import type { LogRecord } from "../deps.ts";

/** A single formatted log entry handed to a {@link DatabaseHandler} subclass. */
export type TLogEntry = {
  datetime: Date;
  level: number;
  levelName: string;
  loggerName: string;
  msg: string;
  args: unknown[];
};

export function toLogEntry(record: LogRecord): TLogEntry {
  return {
    datetime: record.datetime,
    level: record.level,
    levelName: record.levelName,
    loggerName: record.loggerName,
    msg: record.msg,
    args: record.args,
  };
}
