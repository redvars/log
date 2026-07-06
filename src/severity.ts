import { otelLogsApi } from "../deps.ts";

export type LevelName = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";

const LEVELS: LevelName[] = ["DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"];

const SEVERITY_NUMBER_BY_LEVEL: Record<LevelName, otelLogsApi.SeverityNumber> = {
  DEBUG: otelLogsApi.SeverityNumber.DEBUG,
  INFO: otelLogsApi.SeverityNumber.INFO,
  WARN: otelLogsApi.SeverityNumber.WARN,
  ERROR: otelLogsApi.SeverityNumber.ERROR,
  // OTel has no "CRITICAL" band; FATAL is the closest severity number, but we
  // keep the "CRITICAL" text label for continuity with the logger's own API.
  CRITICAL: otelLogsApi.SeverityNumber.FATAL,
};

export function severityNumberFor(level: LevelName): otelLogsApi.SeverityNumber {
  return SEVERITY_NUMBER_BY_LEVEL[level];
}

export function isLevelEnabled(configured: LevelName, level: LevelName): boolean {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(configured);
}
