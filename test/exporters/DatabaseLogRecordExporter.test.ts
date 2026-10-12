import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseLogRecordExporter, LogManager } from "../../mod.js";
import type { TLogEntry } from "../../mod.js";

class FakeDatabaseExporter extends DatabaseLogRecordExporter {
  inserted: TLogEntry[][] = [];
  failNext = false;

  override async insertBatch(entries: TLogEntry[]): Promise<void> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("insert failed");
    }
    await Promise.resolve();
    this.inserted.push(entries);
  }
}

test("DatabaseLogRecordExporter - auto-flushes once the batch size is reached", async () => {
  const exporter = new FakeDatabaseExporter({ batchSize: 2 });
  const manager = new LogManager();
  manager.registerHandler("db", exporter);
  const logger = manager.getLogger("DbTest", "INFO", ["db"]);

  logger.info("one");
  assert.deepStrictEqual(exporter.inserted.length, 0);
  logger.info("two");
  await new Promise((resolve) => setTimeout(resolve, 0)); // let the flush() microtask settle

  assert.deepStrictEqual(exporter.inserted.length, 1);
  assert.deepStrictEqual(exporter.inserted[0].map((e) => e.body), ["one", "two"]);
  await manager.destroy();
});

test("DatabaseLogRecordExporter - manual flush() sends a partial buffer", async () => {
  const exporter = new FakeDatabaseExporter({ batchSize: 100 });
  const manager = new LogManager();
  manager.registerHandler("db", exporter);
  const logger = manager.getLogger("DbTest2", "INFO", ["db"]);

  logger.info("only one");
  await exporter.flush();

  assert.deepStrictEqual(exporter.inserted.length, 1);
  assert.deepStrictEqual(exporter.inserted[0].map((e) => e.body), ["only one"]);
  await manager.destroy();
});

test("DatabaseLogRecordExporter - destroy() flushes remaining entries and stops the timer", async () => {
  const exporter = new FakeDatabaseExporter({ batchSize: 100 });
  const manager = new LogManager();
  manager.registerHandler("db", exporter);
  const logger = manager.getLogger("DbTest3", "INFO", ["db"]);

  logger.info("flush me on destroy");
  await manager.destroy();

  assert.deepStrictEqual(exporter.inserted.length, 1);
});

test("DatabaseLogRecordExporter - a failed insertBatch is reported via onError, not thrown", async () => {
  let reportedError: unknown;
  let reportedBatchSize = 0;
  const exporter = new FakeDatabaseExporter({
    batchSize: 100,
    onError: (error, batch) => {
      reportedError = error;
      reportedBatchSize = batch.length;
    },
  });
  exporter.failNext = true;
  const manager = new LogManager();
  manager.registerHandler("db", exporter);
  const logger = manager.getLogger("DbTest4", "INFO", ["db"]);

  logger.info("this insert will fail");
  await exporter.flush();

  assert.deepStrictEqual((reportedError as Error).message, "insert failed");
  assert.deepStrictEqual(reportedBatchSize, 1);
  assert.deepStrictEqual(exporter.inserted.length, 0);
  await manager.destroy();
});

test("DatabaseLogRecordExporter - flushes on the configured interval", async () => {
  mock.timers.enable({ apis: ["setInterval"] });
  try {
    const exporter = new FakeDatabaseExporter({
      batchSize: 100,
      flushIntervalMs: 1000,
    });
    const manager = new LogManager();
    manager.registerHandler("db", exporter);
    const logger = manager.getLogger("DbTest5", "INFO", ["db"]);

    logger.info("timer flush");
    assert.deepStrictEqual(exporter.inserted.length, 0);

    mock.timers.tick(1000);
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepStrictEqual(exporter.inserted.length, 1);
  } finally {
    mock.timers.reset();
  }
});
