import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileExporter, LogManager } from "../../mod.js";

test("createFileExporter - writes formatted, ANSI-stripped messages to a file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "redvars-log-"));
  const filename = join(dir, "test.log");
  try {
    const manager = new LogManager();
    manager.registerHandler("file", createFileExporter(filename));
    const logger = manager.getLogger("FileTest", "DEBUG", ["file"]);

    logger.info("\x1b[31mhello file\x1b[0m");
    await manager.destroy();

    const content = readFileSync(filename, "utf8");
    assert.deepStrictEqual(content.includes("\x1b["), false);
    assert.match(content, /^\[.+\] INFO {4}FileTest {13}hello file\n$/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
