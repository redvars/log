import { context as otelContext, trace } from "@opentelemetry/api";
import { createConsoleExporter, LogManager } from "../mod.ts";

// A logger built with `@redvars/log` can be bound to an OTel `Context` (e.g.
// one carrying an active span) via `withContext()`. Every subsequent call on
// the bound logger then carries that context, so the resulting log records
// correlate with the span in any observability backend that understands
// OTel trace/span IDs — with zero changes to the call sites that just do
// `logger.info(...)`. This is exactly the mechanism `@redvars/orm` uses to
// correlate all logging inside `client.transaction(async (tx) => {...})`
// with the transaction's span.
const manager = new LogManager();
manager.registerHandler("console", createConsoleExporter());
const logger = manager.getLogger("ContextExample", "INFO");

logger.info("outside any span - no trace/span correlation");

const tracer = trace.getTracer("eg-7-context-propagation");
const span = tracer.startSpan("do-some-work");
const spanContext = trace.setSpan(otelContext.active(), span);
const boundLogger = logger.withContext(spanContext);

boundLogger.info("inside the span - correlates with it in any OTel backend");

span.end();
await manager.destroy();
