# Implementation Plan: Refactor for Esbuild Bundle Compatibility

**Branch**: `013-esbuild-bundle-compatibility` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-esbuild-bundle-compatibility/spec.md`

## Summary

Refactor two source locations that break when the CLI is bundled with esbuild into `dist/main.js`: (1) `src/presentation/cli/cli.ts` reads `package.json` via `__dirname` to get the app version — replaced with the `__APP_VERSION__` bundled variable already defined in `esbuild.config.mts`; (2) `src/infrastructure/persistence/sqlite/sqlite-migrator.ts` locates `drizzle/migrations` via `__dirname` candidates — replaced with `import.meta.url` to resolve the migration files relative to the bundled file. Additionally, pin `drizzle-orm` (v0.45.4) and `drizzle-kit` (v0.31.11) to stable releases and refactor `sqlite.client.ts`, `sqlite-migrator.ts`, and `usage.repository.ts` to use the stable APIs. No application behavior changes, no new user-facing options, no acceptance test modifications. Delivery is incremental: each milestone leaves `npm run quality` green and is presented for review before the next begins.

## Technical Context

**Language/Version**: TypeScript strict mode; Node 26 LTS; ESM (`"type": "module"`)

**Primary Dependencies**: esbuild (devDependency, `0.28.2`); axios, cheerio, commander, drizzle-orm (`0.45.4`), drizzle-kit (`0.31.11`), @libsql/client, env-paths (existing)

**Storage**: N/A — no storage or schema change

**Testing**: Vitest unit tests with 100% coverage (statements, branches, functions, lines per file and aggregate); Cucumber acceptance intentionally not implemented or run for this feature; acceptance tests are not modified (no functional change)

**Target Platform**: Node.js CLI

**Project Type**: Standalone CLI

**Performance Goals**: N/A — internal refactor only

**Constraints**:

- No user-facing behavior change: same CLI command, same output fields, same ordering, same error handling, same exit codes
- Existing acceptance scenarios pass unmodified (zero test edits)
- Use `__APP_VERSION__` bundled variable (already defined in `esbuild.config.mts`) instead of reading `package.json`
- Use `import.meta.url` to locate migration files instead of `__dirname`
- Use `drizzle-orm/better-sqlite3` (`Database` instance) instead of `drizzle-orm/node-sqlite` (string path), resolving `Cannot find module 'drizzle-orm/node-sqlite'` errors
- Use `drizzle-orm/better-sqlite3/migrator` for migration execution
- Explicitly type the `transaction()` callback parameter using `SQLiteTransaction` to satisfy stricter type checking in the stable release
- Every implementation milestone must finish with `npm run quality` passing (format, lint, typecheck, test+coverage)
- Acceptance is deferred to the user; the agent does not execute Cucumber
- No new layers, folders, or dependencies; file naming keeps kebab-case role-suffix convention

**Scale/Scope**: Source files touched: `src/presentation/cli/cli.ts` (version via `__APP_VERSION__`, remove `package.json` file read), `src/infrastructure/persistence/sqlite/sqlite-migrator.ts` (migration file location via `import.meta.url`), `src/infrastructure/persistence/sqlite/sqlite.client.ts` (`drizzle-orm/better-sqlite3` builder), `src/infrastructure/persistence/sqlite/repositories/usage.repository.ts` (typed transaction callback). Tests mirror affected source modules under `tests/unit/`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Hexagonal architecture**: Pass. `cli.ts` is a presentation-layer CLI adapter; `sqlite-migrator.ts`, `sqlite.client.ts`, and `usage.repository.ts` are infrastructure-layer adapters. Changes remain within their respective layers; no cross-layer dependency violations. Concrete adapters instantiated only in `src/presentation/main.ts`.
- **Test-first development**: Pass. For each milestone, add/adjust unit tests first, confirm new tests fail, implement behavior, then run `npm run quality` before review. Acceptance tests are not implemented or run for this feature per the spec.
- **Pipes and filters**: N/A. This refactor concerns CLI version display and migration file location, not pipeline operators.
- **Simplicity / YAGNI**: Pass. No new layers, folders, or dependencies. Four existing files refactored; `__APP_VERSION__` is already defined in `esbuild.config.mts` (no new build configuration needed).
- **Deterministic domain rules**: Pass. No domain rules or business logic are affected.

No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/013-esbuild-bundle-compatibility/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── presentation/
│   └── cli/
│       └── cli.ts              # Updated: version via __APP_VERSION__; remove package.json read
└── infrastructure/
    └── persistence/
        └── sqlite/
            ├── sqlite.client.ts          # Updated: drizzle-orm/better-sqlite3 builder
            ├── sqlite-migrator.ts        # Updated: migration files via import.meta.url; drizzle-orm/better-sqlite3/migrator
            └── repositories/
                └── usage.repository.ts   # Updated: typed transaction callback

tests/
└── unit/
    ├── presentation/cli/
    │   └── cli.test.ts                # Updated: version via __APP_VERSION__
    └── infrastructure/persistence/sqlite/
        ├── sqlite-migrator.test.ts    # Updated: migration file location via import.meta.url
        ├── sqlite-migrator.test.ts    # Updated: drizzle-orm/better-sqlite3/migrator mock
        └── repositories/
            └── usage.repository.test.ts  # Updated: mock migrateSqlite directly
```

**Structure Decision**: Single project (DEFAULT). Use existing modules only; do not add a new layer or folder. Only `cli.ts`, `sqlite.client.ts`, `sqlite-migrator.ts`, and `usage.repository.ts` (plus their unit tests) are touched. No contracts folder is created because the CLI command contract (options, output fields, exit codes) is unchanged by this refactor (consistent with specs 010/011/012).

## Incremental Delivery and Review Milestones

### Milestone 1: CLI version via `__APP_VERSION__` bundled variable

- Refactor `src/presentation/cli/cli.ts` to use the `__APP_VERSION__` bundled variable (already defined in `esbuild.config.mts`) instead of reading `package.json` via `__dirname`.
- Remove now-unused imports (`readFileSync` from `node:fs`, `dirname`/`resolve` from `node:path`) if no longer needed.
- Refactor `tests/unit/presentation/cli/cli.test.ts` (test-first): update version-related assertions to use `__APP_VERSION__`; confirm new tests fail first.
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; `cli.ts` no longer reads `package.json`; version displayed via `__APP_VERSION__`; no acceptance tests run. Presented for review before Milestone 2.

### Milestone 2: Migration file location via `import.meta.url` and drizzle-orm stable pin

- Refactor `src/infrastructure/persistence/sqlite/sqlite-migrator.ts` to locate `drizzle/migrations` using `import.meta.url` (via `fileURLToPath`) instead of `__dirname` candidates.
- Refactor `src/infrastructure/persistence/sqlite/sqlite.client.ts` to use `drizzle-orm/better-sqlite3` (`Database` instance) instead of `drizzle-orm/node-sqlite` (string path), resolving `Cannot find module 'drizzle-orm/node-sqlite'` errors.
- Refactor `src/infrastructure/persistence/sqlite/sqlite-migrator.ts` to change migrator import from `drizzle-orm/node-sqlite/migrator` to `drizzle-orm/better-sqlite3/migrator`.
- Refactor `tests/unit/presentation/cli/cli.test.ts` (test-first): update version-related assertions to use `__APP_VERSION__`; confirm new tests fail first.
- Refactor `tests/unit/infrastructure/persistence/sqlite/sqlite-migrator.test.ts` (test-first): update tests to use `import.meta.url`-based path resolution; confirm new tests fail first.
- Refactor `tests/unit/infrastructure/persistence/sqlite/sqlite-migrator.test.ts` to update mock import path from `drizzle-orm/node-sqlite/migrator` to `drizzle-orm/better-sqlite3/migrator`.
- Refactor `tests/unit/infrastructure/persistence/sqlite/repositories/usage.repository.test.ts` to mock `migrateSqlite` directly and create the `usage` table explicitly, since the stable drizzle migrator no longer auto-creates tables in test context.
- Refactor `tests/unit/application/usecases/decorators/tracked-crawler.sqlite.test.ts` to mock `migrateSqlite` and `hasMigrationFiles` directly to isolate adapter behavior from drizzle internals.
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; `cli.ts` no longer reads `package.json`; version displayed via `__APP_VERSION__`; `sqlite-migrator.ts` no longer uses `__dirname`; migration files resolved via `import.meta.url`; `sqlite.client.ts` uses `drizzle-orm/better-sqlite3`; no acceptance tests run. Presented for review before Milestone 3.

### Milestone 3: Composition root + cleanup + final quality gate

- Delete any now-obsolete code or imports that became unnecessary because of the refactor across `src/`.
- Confirm no references to `__dirname` remain in `cli.ts` or `sqlite-migrator.ts`.
- Verify `npm run build` succeeds (esbuild bundle generates `dist/main.js`).
- Run final `npm run quality` — must be fully green.
- Verify the codebase is left in a clean, green, working state.

**Review gate**: `npm run quality` fully green; `npm run build` succeeds; no `__dirname` references in refactored files; codebase clean and green; ready for user review.

### Final user-run acceptance

After all milestones are reviewed and approved, the user may run the acceptance suite against the bundled binary by setting `HN_CRAWLER_WEB_PAGE_BASE_URL` (and `HN_CRAWLER_DB_PATH`) in the acceptance-test environment. The agent does not execute Cucumber. Any user-reported failure becomes a focused follow-up milestone that must leave `npm run quality` green.

## Complexity Tracking

No additional architecture or constitution exceptions are required.

## Planning Clarification — 2026-11-20

No `[NEEDS CLARIFICATION]` markers remain. All design decisions are resolved with documented assumptions:

- `__APP_VERSION__` is already defined in `esbuild.config.mts` as `JSON.stringify(packageJson.version)` (line 21); no new build configuration needed.
- `import.meta.url` is available because the project uses `"type": "module"` and `module: ESNext` / `moduleResolution: Bundler` in tsconfig.
- `fileURLToPath` from `node:url` is used to convert `import.meta.url` to a filesystem path.
- `drizzle-orm` v0.45.4 and `drizzle-kit` v0.31.11 are pinned as stable releases; `drizzle-orm/better-sqlite3` provides the `drizzle()` builder and `better-sqlite3/migrator` provides the `migrate()` function.
- Acceptance tests are not modified (no functional change), per the spec.
- No new unit tests are required beyond refactoring existing tests for the changed files (the spec's "no new tests" assumption and FR-005/SC-003).
