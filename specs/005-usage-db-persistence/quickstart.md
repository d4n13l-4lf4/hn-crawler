# Quickstart: Persist Usage History

## Prerequisites

- Node version pinned by `.nvmrc` and dependencies installed.
- The package's built-in SQLite runtime support is available.

## Non-acceptance validation

Run after each implementation milestone:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Unit and integration tests use temporary database files and verify schema migration, repository operations, retention, table formatting, and best-effort writes.

## Acceptance validation (authored, not run in this feature)

The acceptance scenario uses the test-only database path override to point two independent CLI invocations at the same temporary database. The first invocation records usage by running `crawl`; the second invokes `usage` and verifies the record is shown. The normal database location remains the `hn-crawler` user data directory.

See [usage CLI contract](contracts/usage-cli.md) and [data model](data-model.md).
