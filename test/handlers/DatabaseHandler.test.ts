import { assertEquals } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { DatabaseHandler, LogManager } from "../../mod.ts";
import type { TLogEntry } from "../../mod.ts";

class FakeDatabaseHandler extends DatabaseHandler {
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

Deno.test("DatabaseHandler - auto-flushes once the batch size is reached", async () => {
  const handler = new FakeDatabaseHandler("INFO", { batchSize: 2 });
  const manager = new LogManager();
  manager.registerHandler("db", handler);
  const logger = manager.getLogger("DbTest", "INFO", ["db"]);

  logger.info("one");
  assertEquals(handler.inserted.length, 0);
  logger.info("two");
  await new Promise((resolve) => setTimeout(resolve, 0)); // let the flush() microtask settle

  assertEquals(handler.inserted.length, 1);
  assertEquals(handler.inserted[0].map((e) => e.msg), ["one", "two"]);
  await manager.destroy();
});

Deno.test("DatabaseHandler - manual flush() sends a partial buffer", async () => {
  const handler = new FakeDatabaseHandler("INFO", { batchSize: 100 });
  const manager = new LogManager();
  manager.registerHandler("db", handler);
  const logger = manager.getLogger("DbTest2", "INFO", ["db"]);

  logger.info("only one");
  await handler.flush();

  assertEquals(handler.inserted.length, 1);
  assertEquals(handler.inserted[0].map((e) => e.msg), ["only one"]);
  await manager.destroy();
});

Deno.test("DatabaseHandler - destroy() flushes remaining entries and stops the timer", async () => {
  const handler = new FakeDatabaseHandler("INFO", { batchSize: 100 });
  const manager = new LogManager();
  manager.registerHandler("db", handler);
  const logger = manager.getLogger("DbTest3", "INFO", ["db"]);

  logger.info("flush me on destroy");
  await manager.destroy();

  assertEquals(handler.inserted.length, 1);
});

Deno.test("DatabaseHandler - a failed insertBatch is reported via onError, not thrown", async () => {
  let reportedError: unknown;
  let reportedBatchSize = 0;
  const handler = new FakeDatabaseHandler("INFO", {
    batchSize: 100,
    onError: (error, batch) => {
      reportedError = error;
      reportedBatchSize = batch.length;
    },
  });
  handler.failNext = true;
  const manager = new LogManager();
  manager.registerHandler("db", handler);
  const logger = manager.getLogger("DbTest4", "INFO", ["db"]);

  logger.info("this insert will fail");
  await handler.flush();

  assertEquals((reportedError as Error).message, "insert failed");
  assertEquals(reportedBatchSize, 1);
  assertEquals(handler.inserted.length, 0);
  await manager.destroy();
});

Deno.test("DatabaseHandler - flushes on the configured interval", async () => {
  const time = new FakeTime();
  try {
    const handler = new FakeDatabaseHandler("INFO", {
      batchSize: 100,
      flushIntervalMs: 1000,
    });
    const manager = new LogManager();
    manager.registerHandler("db", handler);
    const logger = manager.getLogger("DbTest5", "INFO", ["db"]);

    logger.info("timer flush");
    assertEquals(handler.inserted.length, 0);

    await time.tickAsync(1000);
    assertEquals(handler.inserted.length, 1);
  } finally {
    time.restore();
  }
});
