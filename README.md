# @redvars/log

[![JSR](https://jsr.io/badges/@redvars/log)](https://jsr.io/@redvars/log)
[![codecov](https://codecov.io/gh/redvars/log/graph/badge.svg)](https://codecov.io/gh/redvars/log)

A small, extensible logging package for Deno/Node built on the real
[OpenTelemetry Logs SDK](https://opentelemetry.io/docs/specs/otel/logs/) (`@opentelemetry/sdk-logs` +
`@opentelemetry/api-logs`) — not `@std/log`, which Deno's own std team has flagged as
["likely to be removed"](https://github.com/denoland/std/issues/6124).

- **Console**, **file**, and **database** sinks out of the box.
- Extend with a sink for anywhere else — implement the 3-method `LogRecordExporter` interface.
- No global mutable registry: each `LogManager` owns its own `LoggerProvider`/exporters/loggers, so
  independent parts of an app (or independent packages) never collide on names.
- Runtime-toggleable sinks (turn file logging off, database logging on, with no restart).
- Real OTel trace/span **context propagation** — bind a logger to an active span with
  `withContext()` and every log it emits correlates with that span in any OTel-compatible backend.
  `@redvars/orm` uses exactly this to correlate all logging inside a transaction with its span.

## Install

```
deno add jsr:@redvars/log
```

## Quick start

```ts
import { defaultLogManager } from "@redvars/log";

const logger = defaultLogManager.getLogger("MyService");
logger.info("Server started");
```

`defaultLogManager` ships with a `"console"` handler pre-registered — zero config needed for the common case.

## Multiple handlers, your own `LogManager`

```ts
import { createConsoleExporter, createFileExporter, LogManager } from "@redvars/log";

const manager = new LogManager();
manager.registerHandler("console", createConsoleExporter());
manager.registerHandler("file", createFileExporter("./app.log"));

const logger = manager.getLogger("MyService", "DEBUG", ["console", "file"]);
logger.info("This goes to both sinks");

// Before your process exits: flush buffers and close file handles.
await manager.destroy();
```

## Database sink

`DatabaseLogRecordExporter` is deliberately DB-agnostic — it buffers and batches records, then hands
them to an `insertBatch` method you implement for whatever store you use (Postgres, `@redvars/orm`,
SQLite, a hosted log-ingestion API, ...). See
[`examples/eg-3-database-logging.ts`](examples/eg-3-database-logging.ts) and
[`examples/eg-5-orm-integration.ts`](examples/eg-5-orm-integration.ts).

```ts
import { DatabaseLogRecordExporter } from "@redvars/log";
import type { TLogEntry } from "@redvars/log";

class PgDatabaseExporter extends DatabaseLogRecordExporter {
  override async insertBatch(entries: TLogEntry[]): Promise<void> {
    // await pool.query("insert into logs (...) values ...", [...]);
  }
}

manager.registerHandler("database", new PgDatabaseExporter({
  batchSize: 20,       // flush once this many entries are buffered
  flushIntervalMs: 5000, // ...or after this many ms, whichever comes first
  onError: (error, batch) => console.error("failed to persist logs", error, batch),
}));
```

A failing `insertBatch` never throws into your app — it's reported via `onError` (default: `console.error`).

## Flipping sinks at runtime

A logger's active handlers aren't fixed at creation time — turn one off and another on (or swap the
whole set) without restarting anything:

```ts
manager.disableHandler("MyService", "file");
manager.enableHandler("MyService", "database");

// or in one call:
manager.setHandlers("MyService", ["console", "database"]);
```

See [`examples/eg-6-runtime-handler-toggle.ts`](examples/eg-6-runtime-handler-toggle.ts).

## Context propagation (trace/span correlation)

`Logger.withContext(context)` returns a bound logger — every call on it carries that OTel `Context`,
so the resulting log records correlate with an active span in any OTel-compatible backend, with zero
changes to your `.info()`/`.error()` call sites:

```ts
import { context as otelContext, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");
const span = tracer.startSpan("do-some-work");
const boundLogger = logger.withContext(trace.setSpan(otelContext.active(), span));

boundLogger.info("this correlates with the span");
span.end();
```

This works with **zero tracing SDK configured** — `@opentelemetry/api` alone provides safe no-op
tracers/spans, so nothing breaks if the host app hasn't set up OTel tracing; you only get real
correlated trace/span IDs once it does. See
[`examples/eg-7-context-propagation.ts`](examples/eg-7-context-propagation.ts).

## Custom sinks

Anything that implements the `LogRecordExporter` interface (`export`/`shutdown`/`forceFlush`, re-exported
as a type from this package) works — see
[`examples/eg-4-custom-handler.ts`](examples/eg-4-custom-handler.ts) for a webhook-style example.

## Code of Conduct

[Contributor Covenant](/CODE_OF_CONDUCT.md)
