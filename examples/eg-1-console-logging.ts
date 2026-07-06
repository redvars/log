import { defaultLogManager } from "../mod.ts";

// `defaultLogManager` already has a "console" handler registered, so this
// works with zero setup.
const logger = defaultLogManager.getLogger("ConsoleExample", "DEBUG");

logger.debug("Debug details");
logger.info("Server started on port 3000");
logger.warn("Cache miss, falling back to database");
logger.error("Failed to connect to upstream service");
