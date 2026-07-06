import { assertEquals } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { DatabaseLogRecordExporter, LogManager } from "../../mod.ts";
import type { TLogEntry } from "../../mod.ts";

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

Deno.test("DatabaseLogRecordExporter - auto-flushes once the batch size is reached", async () => {
  const exporter = new FakeDatabaseExporter({ batchSize: 2 });
  const manager = new LogManager();
  manager.registerHandler("db", exporter);
  const logger = manager.getLogger("DbTest", "INFO", ["db"]);

  logger.info("one");
  assertEquals(exporter.inserted.length, 0);
  logger.info("two");
  await new Promise((resolve) => setTimeout(resolve, 0)); // let the flush() microtask settle

  assertEquals(exporter.inserted.length, 1);
  assertEquals(exporter.inserted[0].map((e) => e.body), ["one", "two"]);
  await manager.destroy();
});

Deno.test("DatabaseLogRecordExporter - manual flush() sends a partial buffer", async () => {
  const exporter = new FakeDatabaseExporter({ batchSize: 100 });
  const manager = new LogManager();
  manager.registerHandler("db", exporter);
  const logger = manager.getLogger("DbTest2", "INFO", ["db"]);

  logger.info("only one");
  await exporter.flush();

  assertEquals(exporter.inserted.length, 1);
  assertEquals(exporter.inserted[0].map((e) => e.body), ["only one"]);
  await manager.destroy();
});

Deno.test("DatabaseLogRecordExporter - destroy() flushes remaining entries and stops the timer", async () => {
  const exporter = new FakeDatabaseExporter({ batchSize: 100 });
  const manager = new LogManager();
  manager.registerHandler("db", exporter);
  const logger = manager.getLogger("DbTest3", "INFO", ["db"]);

  logger.info("flush me on destroy");
  await manager.destroy();

  assertEquals(exporter.inserted.length, 1);
});

Deno.test("DatabaseLogRecordExporter - a failed insertBatch is reported via onError, not thrown", async () => {
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

  assertEquals((reportedError as Error).message, "insert failed");
  assertEquals(reportedBatchSize, 1);
  assertEquals(exporter.inserted.length, 0);
  await manager.destroy();
});

Deno.test("DatabaseLogRecordExporter - flushes on the configured interval", async () => {
  const time = new FakeTime();
  try {
    const exporter = new FakeDatabaseExporter({
      batchSize: 100,
      flushIntervalMs: 1000,
    });
    const manager = new LogManager();
    manager.registerHandler("db", exporter);
    const logger = manager.getLogger("DbTest5", "INFO", ["db"]);

    logger.info("timer flush");
    assertEquals(exporter.inserted.length, 0);

    await time.tickAsync(1000);
    assertEquals(exporter.inserted.length, 1);
  } finally {
    time.restore();
  }
});
