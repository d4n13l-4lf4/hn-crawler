# Quickstart: Best-Effort Usage Tracking

## Prerequisites

- Node version pinned by `.nvmrc` and dependencies installed.
- A deterministic acceptance URL configured as required by the existing acceptance workflow.

## Non-acceptance validation

Run project gates after each implementation milestone:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
```

Unit tests should exercise default filters, ranking-only requests, title-only requests, success/failure tracking, repository failures, history ordering, and empty usage output. Use the repository's table-driven `it should when` style.

## Acceptance scenarios

The standalone CLI launches a process for each command. Since history is process-local, each `usage` invocation in the acceptance suite starts empty. Populated-history serialization and tracking across crawl outcomes are verified through unit tests that exercise the wired components in one process. Persistence will be addressed in a future feature. No local acceptance execution is required before explicit approval at the final milestone.

See [usage CLI contract](contracts/usage-cli.md) and [data model](data-model.md).
