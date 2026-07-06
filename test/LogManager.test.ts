import { assertEquals, assertThrows } from "@std/assert";
import { createConsoleExporter, LogManager } from "../mod.ts";
import type { LogRecordExporter, ReadableLogRecord } from "../mod.ts";

class RecordingExporter implements LogRecordExporter {
  received: string[] = [];
  export(logs: ReadableLogRecord[], resultCallback: (result: { code: number }) => void): void {
    for (const record of logs) this.received.push(String(record.body));
    resultCallback({ code: 0 });
  }
  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}
}

Deno.test("LogManager - getLogger returns a cached logger for the same name", () => {
  const manager = new LogManager();
  manager.registerHandler("console", createConsoleExporter());

  const a = manager.getLogger("svc-a");
  const b = manager.getLogger("svc-a");
  assertEquals(a, b);
});

Deno.test("LogManager - independent instances don't share loggers or handlers", () => {
  const managerA = new LogManager();
  const managerB = new LogManager();
  managerA.registerHandler("console", createConsoleExporter());
  managerB.registerHandler("console", createConsoleExporter());

  assertEquals(managerA.hasHandler("console"), true);
  assertEquals(managerB.hasHandler("console"), true);

  const loggerA = managerA.getLogger("shared-name");
  const loggerB = managerB.getLogger("shared-name");
  assertEquals(loggerA === loggerB, false);
});

Deno.test("LogManager - throws a clear error for an unregistered handler", () => {
  const manager = new LogManager();
  assertThrows(
    () => manager.getLogger("svc", "INFO", ["missing"]),
    Error,
    'No handler registered under name "missing"',
  );
});

Deno.test("LogManager - setHandlers() flips an existing logger to a different set of handlers", () => {
  const manager = new LogManager();
  const file = new RecordingExporter();
  const db = new RecordingExporter();
  manager.registerHandler("file", file);
  manager.registerHandler("database", db);

  const logger = manager.getLogger("svc", "INFO", ["file"]);
  logger.info("goes to file only");
  assertEquals(file.received.length, 1);
  assertEquals(db.received.length, 0);

  manager.setHandlers("svc", ["database"]);
  logger.info("goes to database only");
  assertEquals(file.received.length, 1);
  assertEquals(db.received.length, 1);
});

Deno.test("LogManager - enableHandler()/disableHandler() toggle a single handler at a time", () => {
  const manager = new LogManager();
  const file = new RecordingExporter();
  const db = new RecordingExporter();
  manager.registerHandler("file", file);
  manager.registerHandler("database", db);

  const logger = manager.getLogger("svc2", "INFO", ["file"]);

  manager.disableHandler("svc2", "file");
  manager.enableHandler("svc2", "database");
  logger.info("only the database handler is active now");

  assertEquals(file.received.length, 0);
  assertEquals(db.received.length, 1);

  // enabling an already-enabled handler doesn't duplicate it
  manager.enableHandler("svc2", "database");
  logger.info("still only inserted once per handler");
  assertEquals(db.received.length, 2);
});

Deno.test("LogManager - setHandlers()/enableHandler() throw for an unregistered logger or handler", () => {
  const manager = new LogManager();
  manager.registerHandler("console", createConsoleExporter());
  manager.getLogger("svc3");

  assertThrows(
    () => manager.setHandlers("does-not-exist", ["console"]),
    Error,
    'No logger created under name "does-not-exist"',
  );
  assertThrows(
    () => manager.setHandlers("svc3", ["missing"]),
    Error,
    'No handler registered under name "missing"',
  );
  assertThrows(
    () => manager.enableHandler("svc3", "missing"),
    Error,
    'No handler registered under name "missing"',
  );
});
