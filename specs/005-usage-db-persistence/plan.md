# Implementation Plan: Persist Usage History

**Branch**: `005-usage-db-persistence` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-usage-db-persistence/spec.md`

## Summary

Replace the in-memory usage repository with a Drizzle-backed SQLite repository while preserving the existing application port and best-effort crawler decorator. Resolve a per-user data directory with `env-paths` under the `hn-crawler` application name, create it before opening the DB, migrate at CLI bootstrap using checked-in Drizzle migrations, and retain a configurable number of newest records (default 100). Render `usage` output as an aligned ASCII table. Include migration files in the published package. Author black-box acceptance coverage for a crawl followed by usage across two CLI processes sharing a temporary DB path; acceptance execution is explicitly out of scope and will not be run for this feature.

## Technical Context

**Language/Version**: TypeScript 5.7 strict mode; Node.js 26 LTS  
**Primary Dependencies**: Drizzle ORM, Drizzle Kit for development migrations, `env-paths`, built-in `node:sqlite`, Vitest, Cucumber  
**Storage**: Local SQLite file under the `hn-crawler` user data directory; test-only path override for acceptance subprocesses  
**Testing**: Vitest with table-driven `it should when` tests; acceptance scenarios authored first but not executed; 100% unit coverage excluding composition root  
**Target Platform**: Node.js CLI on supported Node 26 operating systems; rely on `env-paths` and Node path APIs rather than hand-coded platform directories  
**Project Type**: Single TypeScript CLI project  
**Performance Goals**: Usage reads bounded by retention (default 100); usage writes persist one record and prune excess rows transactionally  
**Constraints**: Preserve dependency direction and `UsageRepositoryPort`; usage writes remain best effort; usage read and migration failures exit non-zero; no external database service; no usage pagination/filtering; acceptance tests not run  
**Scale/Scope**: One local DB per user, four usage fields, configurable positive retention limit defaulting to 100

## Constitution Check

_Gate: Check before research and again after design._

| Principle                             | Status                   | Plan response                                                                                                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hexagonal Architecture with Light DDD | PASS                     | SQLite, Drizzle, and path handling remain infrastructure adapters behind the existing application repository port. Only `main.ts` instantiates adapters.      |
| Test-First Development                | PASS WITH SCOPE DECISION | Add black-box scenarios first and leave them unrun as explicitly directed. Use unit/integration tests and all non-acceptance quality gates at each milestone. |
| Pipes and Filters with Pure Functions | PASS                     | Persistence does not change crawler pipeline processing.                                                                                                      |
| Simplicity and YAGNI                  | PASS                     | Use requested SQLite/Drizzle and path helper; retain the current repository port and avoid a separate service or unnecessary abstraction.                     |
| Deterministic Domain Rules            | PASS                     | Preserve usage fields, canonical filters, insertion ordering, and explicit retention behavior.                                                                |

## Research Decisions

See [research.md](research.md). Key decisions:

- Drizzle ORM with SQLite through Node 26's built-in SQLite support.
- `env-paths('hn-crawler')` resolves the normal data directory; create it before opening the database.
- A test-only path override enables acceptance subprocesses to share an isolated database.
- Checked-in Drizzle migrations live in `drizzle/migrations/`; `drizzle.config.ts` provides local development migration commands.
- Programmatic migration runs at CLI startup before command dispatch.
- Retention pruning is transactional and keeps the newest rows by insertion sequence.
- ASCII table widths are derived from headers and values; line breaks and delimiters are made visible without introducing additional packages.

## Project Structure

### Documentation

```text
specs/005-usage-db-persistence/
├── plan.md
├── research.md
├── data-model.md
├── contracts/usage-cli.md
├── quickstart.md
└── tasks.md
```

### Source Code

```text
src/
├── config/config.ts                              # Retention limit and test DB path configuration
├── infrastructure/persistence/sqlite/
│   ├── sqlite.client.ts
│   ├── sqlite-migrator.ts
│   ├── sqlite-path.ts
│   ├── schema/usage.schema.ts
│   └── repositories/usage.repository.ts
├── presentation/cli/usage.ts                     # ASCII table rendering
└── presentation/main.ts                          # Path, DB, migration, repository, and command wiring

drizzle.config.ts
drizzle/migrations/                                # Generated SQL and metadata; included in npm package

tests/
├── acceptance/features/usage.feature              # Cross-process persistence and table scenarios
├── acceptance/steps/usage.steps.ts                 # Black-box subprocess steps
└── unit/
    ├── infrastructure/persistence/sqlite/
    │   ├── sqlite-path.test.ts
    │   ├── sqlite-migrator.test.ts
    │   └── repositories/usage.repository.test.ts
    └── presentation/cli/usage.test.ts
```

## Incremental Review Milestones

Every milestone should leave the codebase green under formatting, lint, typecheck, tests, and build as applicable. Stop after each suitable milestone for user review. Never execute acceptance tests in this feature.

1. **Acceptance scenarios (test-first, do not run)**: Add black-box feature scenarios for persistence across two separate CLI invocations using one temporary database path, displayed table contents/alignment, empty history, and unsupported usage arguments. Keep the two-invocation acceptance scenario focused; do not add a 100-record acceptance scenario. Run format check, lint, and typecheck only; pause for review.
2. **Dependency, configuration, schema, and migrations**: Add Drizzle, Drizzle Kit, and `env-paths`; define the usage schema; add `drizzle.config.ts`, initial generated SQL migration, local migration scripts, and ensure `drizzle/migrations/` ships in `package.json` `files`. Add config for retention default 100 and the test-only DB path override. Add schema/config tests and run quality gates/build; pause for review.
3. **SQLite path, client, and startup migrator**: Implement `sqlite-path.ts` using `env-paths('hn-crawler')`, ensuring its parent directory exists; implement `sqlite.client.ts`; implement `sqlite-migrator.ts` to apply packaged migrations programmatically. Test path resolution, directory creation, migration success/repeat, and migration errors using temporary DBs. Run quality gates/build; pause for review.
4. **SQLite usage repository**: Implement `UsageRepositoryPort` in `repositories/usage.repository.ts`, including save/get-all mapping and transactional retention pruning to the configured limit. Test inserts, ordering, persistence across reopen, default/custom limits, reduced limit pruning, and database failure behavior. Run quality gates/build; pause for review.
5. **ASCII usage table and composition root**: Replace JSON output with the aligned table and escape delimiters/newlines while preserving displayed values. Wire one SQLite client/repository, run migrations before command dispatch, configure the test database path, and preserve crawl best-effort semantics. Test table rows/widths/empty output and failures. Run all non-acceptance quality gates/build; pause for review.
6. **Acceptance readiness and final non-acceptance gates**: Review the authored two-invocation acceptance scenario and verify environment wiring by static/code inspection only. Do not run acceptance tests. Run `npm run quality` and `npm run build`; record outcomes and pause for review.

## Failure and Lifecycle Decisions

- A usage write failure is swallowed by the existing tracked-crawler decorator and cannot change crawl result/error/exit behavior.
- A `usage` database read failure is reported clearly and exits non-zero; it must not be presented as empty history.
- Startup migration failures are surfaced as non-zero CLI startup failures.
- One transaction covers insertion and retention pruning so partial records are not exposed and prior committed history is preserved on rollback.
- The test-only database path override is used only to isolate acceptance/integration data; normal runs use `env-paths`.

## Complexity Tracking

No constitution violations are expected. Drizzle, SQLite, `env-paths`, migrations, and a small table formatter are directly required by the feature. Existing repository port and decorator remain in place.
