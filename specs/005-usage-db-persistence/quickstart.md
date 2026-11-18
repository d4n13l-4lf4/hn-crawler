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

CI requires the repository Actions variable `HN_CRAWLER_ACCEPTANCE_URL` to be set to a deterministic page URL. For local use, put the same variable in `.env.local` and run:

```bash
HN_CRAWLER_ACCEPTANCE_URL=https://example.test/news npm run test:acceptance:local
```

Or, to load the variable from `.env.local` with dotenvx:

```bash
npm run test:acceptance:local:env
```

These commands are documented for later acceptance validation and were not run as part of this feature.

See [usage CLI contract](contracts/usage-cli.md) and [data model](data-model.md).
