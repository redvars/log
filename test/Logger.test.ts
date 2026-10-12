import { test } from "node:test";
import assert from "node:assert/strict";
import { context as otelContext, trace } from "@opentelemetry/api";
import { LogManager } from "../mod.js";
import type { LogRecordExporter, ReadableLogRecord } from "../mod.js";

class CapturingExporter implements LogRecordExporter {
  captured: ReadableLogRecord[] = [];
  export(logs: ReadableLogRecord[], resultCallback: (result: { code: number }) => void): void {
    this.captured.push(...logs);
    resultCallback({ code: 0 });
  }
  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}
}

test("Logger - withContext() correlates emitted records with the bound span", () => {
  const manager = new LogManager();
  const exporter = new CapturingExporter();
  manager.registerHandler("capture", exporter);
  const logger = manager.getLogger("TxTest", "INFO", ["capture"]);

  // A valid-shaped SpanContext, standing in for a real span (no tracer SDK
  // needed to prove the propagation mechanism itself).
  const spanContext = {
    traceId: "0af7651916cd43dd8448eb211c80319c",
    spanId: "b7ad6b7169203331",
    traceFlags: 1,
  };
  const boundContext = trace.setSpanContext(otelContext.active(), spanContext);
  const boundLogger = logger.withContext(boundContext);

  logger.info("no context on this one");
  boundLogger.info("this one is correlated to the span");

  assert.deepStrictEqual(exporter.captured.length, 2);
  assert.deepStrictEqual(exporter.captured[0].spanContext, undefined);
  assert.notDeepStrictEqual(exporter.captured[1].spanContext, undefined);
  assert.deepStrictEqual(exporter.captured[1].spanContext?.traceId, spanContext.traceId);
  assert.deepStrictEqual(exporter.captured[1].spanContext?.spanId, spanContext.spanId);
});

test("Logger - levelName getter reflects the configured level", () => {
  const manager = new LogManager();
  manager.registerHandler("capture", new CapturingExporter());
  const logger = manager.getLogger("LevelTest", "DEBUG", ["capture"]);
  assert.deepStrictEqual(logger.levelName, "DEBUG");
});
