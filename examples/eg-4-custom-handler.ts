import { log, LogManager } from "../mod.ts";
import type { LogRecord } from "../mod.ts";

// Any sink can be added by extending `log.BaseHandler` directly — the
// database handler in eg-3 is just one example of this pattern. Here's a
// synchronous webhook-style handler that posts each line to an in-memory
// list (swap `send` for a real `fetch()` call to a webhook/alerting service).
class WebhookHandler extends log.BaseHandler {
  sent: string[] = [];

  override log(msg: string): void {
    this.sent.push(msg);
  }
}

const manager = new LogManager();
const webhook = new WebhookHandler("WARN", {
  formatter: (record: LogRecord) => `[ALERT] ${record.levelName}: ${record.msg}`,
});
manager.registerHandler("webhook", webhook);
const logger = manager.getLogger("CustomHandlerExample", "DEBUG", ["webhook"]);

logger.debug("not sent, below WARN threshold");
logger.warn("disk usage above 90%");
logger.error("payment provider timed out");

console.log(webhook.sent);
