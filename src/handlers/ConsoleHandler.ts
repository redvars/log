import { log } from "../../deps.ts";
import type { ConsoleHandlerOptions, LevelName } from "../../deps.ts";
import { defaultFormatter } from "./formatters.ts";

export function createConsoleHandler(
  levelName: LevelName = "NOTSET",
  options: Partial<ConsoleHandlerOptions> = {},
): log.ConsoleHandler {
  return new log.ConsoleHandler(levelName, {
    formatter: defaultFormatter,
    ...options,
  });
}
