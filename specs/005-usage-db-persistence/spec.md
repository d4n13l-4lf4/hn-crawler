# Feature Specification: Persist Usage History

## Clarifications

### Session 2026-11-18

- Q: If a crawl succeeds but saving its usage record fails, should the crawl still exit successfully? → A: Keep the crawl successful; usage persistence remains best effort and may omit that record.
- Q: How should the usage-history retention limit be configured? → A: Through the project's application configuration only; it defaults to 100 and is not a CLI option or environment override.
- Q: What identifier should the table's `ID` column display? → A: Display the usage record's UUIDv7 request ID; no additional database-generated ID is required.
- Q: How should acceptance tests isolate the persistent database while verifying two separate CLI invocations? → A: Provide a test-only database path override and run both invocations against the same temporary database; normal runs use the per-user data directory.
- Q: Should an empty usage table include a separator row? → A: Yes. Empty output includes the heading, column header row, and separator row, with no data rows.

**Feature Branch**: `005-usage-db-persistence`  
**Created**: 2026-11-18  
**Status**: Draft  
**Input**: User description: "Implement persistent storage for CLI usage records, store the database under the user's data directory, show usage in an aligned ASCII table, and retain only a configurable number of recent records (default 100)."

## User Scenarios & Testing

### User Story 1 - Persist Crawl Usage (Priority: P1)

As a CLI user, I want usage records to survive separate command invocations and restarts, so that I can inspect an ongoing history of crawler activity.

**Why this priority**: Persistence enables the existing usage command to report real history beyond the lifetime of a single process.

**Independent Test**: Run a successful crawl, exit the process, invoke the usage command, and verify the newly recorded request is present. Repeat after restarting the CLI.

**Acceptance Scenarios**:

1. **Given** a successful crawl is run, **When** the crawl process exits and the user invokes `usage`, **Then** the crawl's usage record is present in the displayed history.
2. **Given** a crawl attempt fails, **When** the crawl process exits and the user invokes `usage`, **Then** the failed attempt's usage record is persisted if tracking storage is available, and the existing crawl error behavior is preserved.
3. **Given** the CLI is started again after prior records were stored, **When** the user invokes `usage`, **Then** records from earlier process runs remain available.
4. **Given** usage storage cannot be written during an otherwise successful crawl, **When** the crawl completes, **Then** the crawl result and successful exit status are preserved, although that usage record may be absent.
5. **Given** usage storage cannot be read, **When** the user invokes `usage`, **Then** the command reports a clear retrieval error and exits non-zero without presenting the failure as an empty history.
6. **Given** a write or read operation fails, **When** the failure is handled, **Then** previously committed records remain intact and no partial record is presented.

### User Story 2 - View Usage in a Readable Table (Priority: P1)

As a CLI user, I want usage records displayed in a clearly aligned ASCII table, so that I can scan request IDs, timestamps, applied filters, and durations.

**Why this priority**: A readable tabular view is the primary user-facing result of persisted history.

**Independent Test**: Seed multiple records with different field lengths, invoke `usage`, and verify the heading, column order, aligned separators, and rendered values.

**Acceptance Scenarios**:

1. **Given** usage records exist, **When** the user invokes `usage`, **Then** output starts with `Usage data` and includes columns `ID`, `Request Timestamp`, `Applied Filters`, and `Duration (ms)` in that order.
2. **Given** records have values of different lengths, **When** they are displayed, **Then** each column's values and separators are aligned consistently across the header and rows.
3. **Given** no records exist, **When** the user invokes `usage`, **Then** the command displays the heading, table headers, and separator row with no data rows.
4. **Given** values contain characters such as `|` or line breaks, **When** the table is rendered, **Then** each record remains on one row and the table structure remains readable.

### User Story 3 - Limit Stored History (Priority: P1)

As a CLI maintainer, I want the maximum usage history size to be configurable, so that storage remains bounded while retaining the most recent activity.

**Why this priority**: A bounded history prevents unbounded local storage growth while preserving recent usage.

**Independent Test**: Configure a small record limit, write more records than the limit, restart the CLI, and verify only the newest configured number remain in chronological insertion order.

**Acceptance Scenarios**:

1. **Given** no retention limit is configured, **When** more than 100 records are saved, **Then** only the latest 100 remain available.
2. **Given** a positive retention limit is configured, **When** more records than the limit are saved, **Then** only the newest configured number remain available in request insertion order.
3. **Given** the configured limit is changed, **When** the next record is saved, **Then** the retained history is reduced to the new limit.

### Edge Cases

- The user's data directory does not yet exist when the CLI first stores a record.
- The database file or parent directory is unavailable, unreadable, or not writable.
- The database contains no usage records.
- The retention limit is invalid or zero; invalid configuration must be rejected with a clear configuration error rather than silently causing unbounded storage.
- The process stops during a write; existing committed records remain readable and partial records are not shown.
- A record's values contain table delimiters, Unicode, or newlines.
- Multiple records share the same request timestamp; insertion order remains deterministic.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST persist usage records in a local file-based database.
- **FR-002**: The database MUST be stored in the operating system's user data directory using a cross-platform location appropriate for this application.
- **FR-003**: The system MUST ensure the required user data directory exists before creating or opening the database.
- **FR-004**: Persisted records MUST survive command process exit and subsequent CLI restarts.
- **FR-005**: The `usage` command MUST retrieve persisted records and display them in a readable ASCII table.
- **FR-006**: The table MUST start with `Usage data` and contain columns in this order: `ID`, `Request Timestamp`, `Applied Filters`, and `Duration (ms)`.
- **FR-007**: The table MUST align each column consistently across its header, separator, and data rows.
- **FR-008**: Table rendering MUST keep every record on one visual row and MUST preserve the values in an unambiguous readable form, including values containing delimiters or line breaks.
- **FR-009**: The system MUST retain at most the maximum record count defined in application configuration, defaulting to 100 when not explicitly changed in that configuration. The limit is not exposed as a CLI option or environment override.
- **FR-010**: When records exceed the configured retention limit, the system MUST retain the newest records by request insertion order and remove older records.
- **FR-011**: A successful crawl MUST attempt to persist one usage record, and a failed crawl MUST attempt to persist one usage record, subject to the established best-effort tracking behavior.
- **FR-012**: A usage database write failure MUST NOT change a crawl's result, error, or exit status; the record may be omitted. A database read failure in the `usage` command MUST be reported clearly and produce a non-zero exit status.
- **FR-015**: Database failures MUST NOT corrupt previously committed records or expose partially written records.
- **FR-013**: Existing crawl output, filtering, ranking, URL handling, and crawl error behavior MUST remain unchanged by persistence integration.
- **FR-014**: The persistence implementation MUST use a file-based DB and MUST NOT require a separately running database service.

### Key Entities

- **Usage record**: A crawl attempt with a unique request ID, request timestamp, applied filters, and duration.
- **Usage history**: An ordered collection of persisted usage records, bounded by the configured retention limit.
- **Retention configuration**: A positive integer maximum record count, defaulting to 100.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A usage record created by a crawl is visible from a subsequent independent CLI invocation after the original process exits.
- **SC-002**: Usage output displays all four required fields in the documented order, with aligned columns for records with varying lengths.
- **SC-003**: With default settings, a history exceeding 100 records contains exactly the newest 100 records.
- **SC-004**: With a configured positive limit N, a history exceeding N records contains exactly the newest N records in insertion order.
- **SC-005**: A new user installation can create and use its database under its user data directory without manual directory setup.
- **SC-006**: Storage failures do not cause malformed or partially committed usage rows to appear in later reads.

## Assumptions

- The existing usage record fields remain unchanged; the displayed `ID` column represents the record's UUIDv7 `request_id`. No separate database-generated identifier is required.
- Request insertion order determines recency when timestamps are equal.
- The retention limit is configured only through the project's application configuration and defaults to 100.
- Usage persistence remains best effort for crawl operations: storage failure can omit a record, but cannot alter crawl behavior. Usage retrieval errors are reported by the usage command as failures.
- Normal runs store data beneath the user's application data directory. Acceptance tests may override the database path to a temporary location so separate CLI invocations can share isolated test data.
- The storage schema/migration approach and exact cross-platform data-directory helper are implementation decisions for the plan.
- The feature does not add usage filtering, pagination, export formats, or a database server.
- Acceptance tests for this feature are authored but not executed unless separately brought into scope; unit and non-acceptance quality gates are used for implementation verification.
