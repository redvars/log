import { test } from "node:test";
import assert from "node:assert/strict";
import { createConsoleExporter, LogManager } from "../../mod.js";

test("createConsoleExporter - logs formatted messages to the console", () => {
  const manager = new LogManager();
  manager.registerHandler("console", createConsoleExporter({ useColors: false }));
  const logger = manager.getLogger("ConsoleTest", "DEBUG");

  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => lines.push(msg);
  try {
    logger.info("hello world");
  } finally {
    console.log = originalLog;
  }

  assert.deepStrictEqual(lines.length, 1);
  assert.match(lines[0], /^\[.+\] INFO {4}ConsoleTest {10}hello world$/);
});
