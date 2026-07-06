import { LogManager } from "../mod.ts";
import type { LogRecordExporter, ReadableLogRecord } from "../mod.ts";
import { toLogEntry } from "../mod.ts";

// Any sink can be added by implementing the 3-method `LogRecordExporter`
// interface directly - the database exporter in eg-3 is just one example of
// this pattern. Here's a synchronous webhook-style exporter that posts each
// line to an in-memory list (swap `sent.push` for a real `fetch()` call to a
// webhook/alerting service).
class WebhookExporter implements LogRecordExporter {
  sent: string[] = [];

  export(logs: ReadableLogRecord[], resultCallback: (result: { code: number }) => void): void {
    for (const record of logs) {
      const entry = toLogEntry(record);
      if (entry.severityText === "WARN" || entry.severityText === "ERROR") {
        this.sent.push(`[ALERT] ${entry.severityText}: ${entry.body}`);
      }
    }
    resultCallback({ code: 0 });
  }

  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}
}

const manager = new LogManager();
const webhook = new WebhookExporter();
manager.registerHandler("webhook", webhook);
const logger = manager.getLogger("CustomHandlerExample", "DEBUG", ["webhook"]);

logger.debug("not sent, below WARN threshold in this example's own filtering");
logger.warn("disk usage above 90%");
logger.error("payment provider timed out");

console.log(webhook.sent);
