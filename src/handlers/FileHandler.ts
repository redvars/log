import { log } from "../../deps.ts";
import type { FileHandlerOptions, LevelName } from "../../deps.ts";
import { plainTextFormatter } from "./formatters.ts";

export function createFileHandler(
  filename: string,
  levelName: LevelName = "NOTSET",
  options: Partial<FileHandlerOptions> = {},
): log.FileHandler {
  return new log.FileHandler(levelName, {
    filename,
    formatter: plainTextFormatter,
    ...options,
  });
}
