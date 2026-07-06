# @redvars/log

[![JSR](https://jsr.io/badges/@redvars/log)](https://jsr.io/@redvars/log)
[![codecov](https://codecov.io/gh/redvars/log/graph/badge.svg)](https://codecov.io/gh/redvars/log)

A small, extensible logging package for Deno/Node built on top of [`@std/log`](https://jsr.io/@std/log).

- **Console**, **file**, and **database** sinks out of the box.
- Extend with a sink for anywhere else — any class extending `log.BaseHandler` works.
- No global mutable registry: each `LogManager` owns its own handlers/loggers, so independent
  parts of an app (or independent packages) never collide on names.

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
import { createConsoleHandler, createFileHandler, LogManager } from "@redvars/log";

const manager = new LogManager();
manager.registerHandler("console", createConsoleHandler());
manager.registerHandler("file", createFileHandler("./app.log"));

const logger = manager.getLogger("MyService", "DEBUG", ["console", "file"]);
logger.info("This goes to both sinks");

// Before your process exits: flush buffers and close file handles.
await manager.destroy();
```

## Database sink

`DatabaseHandler` is deliberately DB-agnostic — it buffers and batches records, then hands them to
an `insertBatch` method you implement for whatever store you use (Postgres, `@redvars/orm`, SQLite,
a hosted log-ingestion API, ...). See [`examples/eg-3-database-logging.ts`](examples/eg-3-database-logging.ts)
and [`examples/eg-5-orm-integration.ts`](examples/eg-5-orm-integration.ts).

```ts
import { DatabaseHandler } from "@redvars/log";
import type { TLogEntry } from "@redvars/log";

class PgDatabaseHandler extends DatabaseHandler {
  override async insertBatch(entries: TLogEntry[]): Promise<void> {
    // await pool.query("insert into logs (...) values ...", [...]);
  }
}

manager.registerHandler("database", new PgDatabaseHandler("INFO", {
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

## Custom sinks

Anything that extends `log.BaseHandler` (re-exported as `log` from this package) works — see
[`examples/eg-4-custom-handler.ts`](examples/eg-4-custom-handler.ts) for a webhook-style example.

## Code of Conduct

[Contributor Covenant](/CODE_OF_CONDUCT.md)
