import { assertEquals, assertMatch } from "@std/assert";
import { createConsoleHandler, LogManager } from "../../mod.ts";

Deno.test("createConsoleHandler - logs formatted messages to the console", () => {
  const manager = new LogManager();
  manager.registerHandler("console", createConsoleHandler("DEBUG", { useColors: false }));
  const logger = manager.getLogger("ConsoleTest", "DEBUG");

  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => lines.push(msg);
  try {
    logger.info("hello world");
  } finally {
    console.log = originalLog;
  }

  assertEquals(lines.length, 1);
  assertMatch(lines[0], /^\[.+\] INFO {4}ConsoleTest {10}hello world$/);
});
