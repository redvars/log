import { createConsoleExporter, createFileExporter, LogManager } from "../mod.ts";

const manager = new LogManager();
manager.registerHandler("console", createConsoleExporter());
manager.registerHandler("file", createFileExporter("./app.log"));

// A logger can use several handlers at once.
const logger = manager.getLogger("FileExample", "DEBUG", ["console", "file"]);

logger.info("This line goes to both the console and ./app.log");

// Flush and close the file before the script exits.
await manager.destroy();
