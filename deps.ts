import * as otelLogsApi from "@opentelemetry/api-logs";
import * as otelLogsSdk from "@opentelemetry/sdk-logs";
import * as otelResources from "@opentelemetry/resources";
import * as otelCore from "@opentelemetry/core";

export { otelCore, otelLogsApi, otelLogsSdk, otelResources };

export type { Context } from "@opentelemetry/api";
export type {
  LogRecordExporter,
  LogRecordProcessor,
  ReadableLogRecord,
  SdkLogRecord,
} from "@opentelemetry/sdk-logs";
