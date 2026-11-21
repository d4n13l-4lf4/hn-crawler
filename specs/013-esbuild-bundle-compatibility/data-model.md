# Data Model: Refactor for Esbuild Bundle Compatibility

**Feature**: 013-esbuild-bundle-compatibility  
**Date**: 2026-11-20  
**Status**: Complete

## Entities

No new domain entities are introduced. The feature touches CLI version display and migration file location only; existing domain entities and value objects are unchanged.

## Configuration

### App version (`src/presentation/cli/cli.ts`)

The CLI version string displayed by `hn-crawler --version` is currently read from `package.json` at runtime. After this feature, it is supplied by the `__APP_VERSION__` bundled variable, which `esbuild.config.mts` defines as `JSON.stringify(packageJson.version)` at build time via esbuild's `define` option.

| Setting     | Source                             | Notes                                                                         |
| ----------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| App version | `__APP_VERSION__` bundled variable | Defined in `esbuild.config.mts` line 21; replaces runtime `package.json` read |

### Migration file location (`src/infrastructure/persistence/sqlite/sqlite-migrator.ts`)

The directory containing SQLite migration SQL files is currently located via `__dirname`-relative path candidates. After this feature, it is located via `import.meta.url` converted with `fileURLToPath`, resolved relative to the bundled file's directory.

| Setting              | Source                                                     | Notes                                        |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| Migrations directory | `fileURLToPath(import.meta.url)` → `../drizzle/migrations` | Resolved relative to `dist/main.js` location |

## Relationships

- `esbuild.config.mts` (build config) defines `__APP_VERSION__` and is consumed by `src/presentation/cli/cli.ts` at build time via esbuild's `define` option.
- `src/infrastructure/persistence/sqlite/sqlite-migrator.ts` uses `import.meta.url` to locate `drizzle/migrations` at runtime; invoked from `src/presentation/main.ts` via `migrateSqlite()`.
- `drizzle/migrations/` (repository root) contains the migration SQL files; unchanged by this feature.

## Storage

No storage or schema change. Migration SQL files in `drizzle/migrations/` are unchanged.

## Acceptance-test environment

Acceptance tests target the CLI via `HN_CRAWLER_WEB_PAGE_BASE_URL`, unchanged by this feature. No new environment variables are required.
