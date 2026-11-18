# Research: Persist Usage History

## Decisions

### ORM and embedded database

- **Decision**: Use Drizzle ORM with SQLite, backed by Node 26's built-in `node:sqlite` driver.
- **Rationale**: SQLite is a local file database that requires no service process, matches the project architecture's technology guidance, and Drizzle provides typed schema and migration support without replacing the existing repository port.
- **Alternatives considered**: Direct `node:sqlite` SQL without an ORM was simpler but does not follow the user's explicit Drizzle requirement. A remote database violates the file-based, self-contained scope.

### User data directory and database path

- **Decision**: Use `env-paths` with the application name `hn-crawler` to locate the user's data directory, ensure the directory exists before opening SQLite, and store the database file there. Add a test-only database-path override so acceptance tests can run separate CLI processes against the same temporary database.
- **Rationale**: `env-paths` selects an OS-appropriate per-user directory. A test override avoids touching real user data and enables cross-process persistence tests without introducing a test-only storage mode into runtime behavior beyond path selection.
- **Alternatives considered**: Hard-coded platform directories are not portable. Reusing the repository root risks accidental database check-ins. A temporary database per process cannot verify persistence across invocations.

### Migrations

- **Decision**: Store generated Drizzle SQL migrations under `drizzle/migrations/`, configure Drizzle Kit at the repository root, and apply migrations programmatically during CLI bootstrap before command execution.
- **Rationale**: Checked-in migrations keep schema evolution reviewable and distributable. Startup migration ensures the published CLI can open a synchronized database without requiring a separate command from users.
- **Alternatives considered**: Requiring users to run migrations manually makes the CLI fragile after install or upgrade. Runtime schema creation embedded in the repository obscures schema history and is less reviewable.

### Retention and ordering

- **Decision**: Apply the configured positive record limit transactionally on each write, defaulting to 100. Order by insertion identity, not timestamps, and delete rows older than the newest limit.
- **Rationale**: This bounds storage and gives deterministic ordering for equal timestamps. The limit is owned by application configuration, not a CLI flag or environment variable.
- **Alternatives considered**: Timestamp-only ordering cannot define deterministic order for ties. A cleanup job is unnecessary at this scale.

### Usage table rendering

- **Decision**: Render an ASCII table in the usage CLI with fixed column order and widths sized from headers and values. Sanitize embedded line breaks and escape table delimiters so every database row remains one readable table row. Display UUIDv7 `request_id` as the `ID` column.
- **Rationale**: Dynamic widths ensure alignment for varying values without truncating IDs or filter descriptions. Escaping preserves the table layout while retaining visible data.
- **Alternatives considered**: Fixed widths can truncate values. Adding a table dependency is avoidable for a four-column display.

### Failure behavior

- **Decision**: SQLite writes remain best effort: write failures do not change crawl results or errors. Usage read or migration failures are reported as clear non-zero command/bootstrap failures. Each write and retention cleanup run in one database transaction.
- **Rationale**: This preserves the existing crawl tracking contract while keeping history operations honest and preventing partial rows from being exposed.
- **Alternatives considered**: Failing a crawl because telemetry storage failed contradicts the existing best-effort tracking requirement. Returning an empty table on read failure would misrepresent an unavailable database as no history.

## Compatibility Notes

- Node 26 and its built-in SQLite support are already pinned by the project. Confirm the selected Drizzle driver adapter supports this runtime and package versions during implementation.
- Package distribution must include the checked-in migration directory and Drizzle runtime metadata required by programmatic migration.
- Local development scripts should support generating and inspecting migrations without running acceptance tests.
