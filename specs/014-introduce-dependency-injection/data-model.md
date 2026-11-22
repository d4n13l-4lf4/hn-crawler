# Data Model: DI Container Binding Map

This document describes the binding model for the `inversify` DI container introduced in `src/bootstrap/`. It is a design-time model of which container token resolves to which concrete type, and at what scope. It does not describe domain entities (which are unchanged by this refactor).

## Binding Tokens

Each binding is identified by a `Symbol` token defined in `src/bootstrap/tokens.ts`. Tokens are grouped by layer:

| Token (Symbol)                | Layer                                 | Resolves to (concrete type) | Scope     | Constructor dependencies                          |
| ----------------------------- | ------------------------------------- | --------------------------- | --------- | ------------------------------------------------- |
| `TYPES.Config`                | config                                | `Config` (module instance)  | singleton | none                                              |
| `TYPES.EntrySource`           | infrastructure (web port out)         | `HnWebAdapter`              | singleton | `HnHttpClient`, `maxPagesToFetch` (config)        |
| `TYPES.HttpClient`            | infrastructure (web)                  | `HnHttpClient`              | singleton | axios instance                                    |
| `TYPES.AxiosInstance`         | infrastructure (web)                  | axios instance              | singleton | baseURL, timeout, maxRetries, retryDelay (config) |
| `TYPES.SqliteClient`          | infrastructure (persistence)          | SQLite database client      | singleton | database path                                     |
| `TYPES.UsageRepository`       | infrastructure (persistence port out) | `SqliteUsageRepository`     | singleton | database client, `usageRetentionLimit` (config)   |
| `TYPES.CrawlerUseCase`        | application                           | `CrawlerUseCase`            | singleton | `EntrySource`, `PipelineFactory`                  |
| `TYPES.TrackedCrawlerUseCase` | application (decorator)               | `TrackedCrawlerUseCase`     | singleton | `CrawlerUseCase`, `UsageRepository`               |
| `TYPES.UsageQueryUseCase`     | application                           | `UsageQueryUseCase`         | singleton | `UsageRepository`                                 |
| `TYPES.PipelineFactory`       | application                           | `pipelineFactory`           | singleton | none                                              |
| `TYPES.SqliteMigrator`        | infrastructure (persistence)          | `migrateSqlite` function    | singleton | database client                                   |
| `TYPES.SqlitePathResolver`    | infrastructure (persistence)          | `getSqlitePath` function    | singleton | none                                              |

## Binding Scope

All bindings are registered as singletons (`inSingletonScope`). The container creates each instance once and reuses it for the lifetime of the application process, matching the current manual-wiring behavior in the composition root.

## Binding Dependencies

The binding graph follows the dependency rule:

```
Domain ← Application ← Infrastructure (adapters implement ports)
Presentation (composition root) assembles everything via the container
```

- Domain entities, value objects, and policies are not bound in the container (they are instantiated as values or have no dependencies).
- Application use cases depend only on ports (interfaces) and other application modules.
- Infrastructure adapters implement application ports and may depend on config values.
- The composition root (`src/main.ts`) is the only place that resolves from the container and passes concrete instances to CLI command constructors.

## Container Lifecycle

1. `src/main.ts` calls `createContainer()` at startup.
2. The container resolves dependencies needed for database migration (`SqliteClient`, `SqliteMigrator`).
3. Migration executes (existing behavior preserved).
4. The container resolves use cases (`TrackedCrawlerUseCase`, `UsageQueryUseCase`) and passes them to CLI command constructors.
5. The CLI parses `process.argv` and runs (existing behavior preserved).
6. On process exit, the database client is closed (existing `finally` block preserved).

## Notes

- `Config` is treated as a singleton binding even though it is currently a module-level object; this keeps the binding map uniform.
- Factory functions (`createAxiosHttpClient`, `createSqliteClient`, `getSqlitePath`, `migrateSqlite`, `pipelineFactory`) are bound as values/factories rather than classes.
- No CLI commands are bound in the container yet (deferred to a future task).
