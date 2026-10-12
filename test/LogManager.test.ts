import { test } from "node:test";
import assert from "node:assert/strict";
import { createConsoleExporter, LogManager } from "../mod.js";
import type { LogRecordExporter, ReadableLogRecord } from "../mod.js";

class RecordingExporter implements LogRecordExporter {
  received: string[] = [];
  export(logs: ReadableLogRecord[], resultCallback: (result: { code: number }) => void): void {
    for (const record of logs) this.received.push(String(record.body));
    resultCallback({ code: 0 });
  }
  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}
}

test("LogManager - getLogger returns a cached logger for the same name", () => {
  const manager = new LogManager();
  manager.registerHandler("console", createConsoleExporter());

  const a = manager.getLogger("svc-a");
  const b = manager.getLogger("svc-a");
  assert.deepStrictEqual(a, b);
});

test("LogManager - independent instances don't share loggers or handlers", () => {
  const managerA = new LogManager();
  const managerB = new LogManager();
  managerA.registerHandler("console", createConsoleExporter());
  managerB.registerHandler("console", createConsoleExporter());

  assert.deepStrictEqual(managerA.hasHandler("console"), true);
  assert.deepStrictEqual(managerB.hasHandler("console"), true);

  const loggerA = managerA.getLogger("shared-name");
  const loggerB = managerB.getLogger("shared-name");
  assert.deepStrictEqual(loggerA === loggerB, false);
});

test("LogManager - throws a clear error for an unregistered handler", () => {
  const manager = new LogManager();
  assert.throws(
    () => manager.getLogger("svc", "INFO", ["missing"]),
    { name: "Error", message: new RegExp('No handler registered under name "missing"') },
  );
});

test("LogManager - setHandlers() flips an existing logger to a different set of handlers", () => {
  const manager = new LogManager();
  const file = new RecordingExporter();
  const db = new RecordingExporter();
  manager.registerHandler("file", file);
  manager.registerHandler("database", db);

  const logger = manager.getLogger("svc", "INFO", ["file"]);
  logger.info("goes to file only");
  assert.deepStrictEqual(file.received.length, 1);
  assert.deepStrictEqual(db.received.length, 0);

  manager.setHandlers("svc", ["database"]);
  logger.info("goes to database only");
  assert.deepStrictEqual(file.received.length, 1);
  assert.deepStrictEqual(db.received.length, 1);
});

test("LogManager - enableHandler()/disableHandler() toggle a single handler at a time", () => {
  const manager = new LogManager();
  const file = new RecordingExporter();
  const db = new RecordingExporter();
  manager.registerHandler("file", file);
  manager.registerHandler("database", db);

  const logger = manager.getLogger("svc2", "INFO", ["file"]);

  manager.disableHandler("svc2", "file");
  manager.enableHandler("svc2", "database");
  logger.info("only the database handler is active now");

  assert.deepStrictEqual(file.received.length, 0);
  assert.deepStrictEqual(db.received.length, 1);

  // enabling an already-enabled handler doesn't duplicate it
  manager.enableHandler("svc2", "database");
  logger.info("still only inserted once per handler");
  assert.deepStrictEqual(db.received.length, 2);
});

test("LogManager - setHandlers()/enableHandler() throw for an unregistered logger or handler", () => {
  const manager = new LogManager();
  manager.registerHandler("console", createConsoleExporter());
  manager.getLogger("svc3");

  assert.throws(
    () => manager.setHandlers("does-not-exist", ["console"]),
    { name: "Error", message: new RegExp('No logger created under name "does-not-exist"') },
  );
  assert.throws(
    () => manager.setHandlers("svc3", ["missing"]),
    { name: "Error", message: new RegExp('No handler registered under name "missing"') },
  );
  assert.throws(
    () => manager.enableHandler("svc3", "missing"),
    { name: "Error", message: new RegExp('No handler registered under name "missing"') },
  );
});
