import { assertEquals, assertMatch } from "@std/assert";
import { createFileExporter, LogManager } from "../../mod.ts";

Deno.test("createFileExporter - writes formatted, ANSI-stripped messages to a file", async () => {
  const filename = await Deno.makeTempFile({ suffix: ".log" });
  try {
    const manager = new LogManager();
    manager.registerHandler("file", createFileExporter(filename));
    const logger = manager.getLogger("FileTest", "DEBUG", ["file"]);

    logger.info("\x1b[31mhello file\x1b[0m");
    await manager.destroy();

    const content = await Deno.readTextFile(filename);
    assertEquals(content.includes("\x1b["), false);
    assertMatch(content, /^\[.+\] INFO {4}FileTest {13}hello file\n$/);
  } finally {
    await Deno.remove(filename);
  }
});
