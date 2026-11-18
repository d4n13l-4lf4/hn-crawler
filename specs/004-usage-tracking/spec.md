# Feature Specification: Best-Effort Usage Tracking

## Clarifications

### Session 2026-11-18

- Q: What exact marker should `applied_filters` use when a crawl has no title-word filter? → A: Omit the title-filter part; include only the sort label.
- Q: Should usage history be available across CLI invocations, or only within one process? → A: Only within one process for this feature; proper persistence will be implemented in a future feature.
- Q: Is execution of the acceptance suite in scope for this feature? → A: No. Acceptance execution is out of scope for this feature; the suite remains authored for later use, and only non-acceptance quality gates are run here.

**Feature Branch**: `feature/usage-tracking`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Track each crawl request's timestamp, applied filter, and duration in milliseconds on a best-effort basis, and expose the current usage history through a new `usage` CLI subcommand. Use a short-lived in-memory list for this scaffold; persistent storage is out of scope."

## User Scenarios & Testing

### User Story 1 - Record Crawl Usage (Priority: P1)

As a maintainer, I want each crawl request recorded with its start timestamp, applied options, and duration, so that I can inspect how the crawler is being used and how long requests take.

**Why this priority**: Recording usage is the core capability that supplies data for the usage command.

**Independent Test**: Run crawl operations with different option combinations and verify each attempt creates one usage record with a UUIDv7 request ID, a UTC Unix-millisecond start timestamp, the expected filter description, and a non-negative duration in milliseconds.

**Acceptance Scenarios**:

1. **Given** a crawl request using the default options, **When** the request completes, **Then** one usage record is created with the request start timestamp, elapsed duration, and an applied-filter string identifying comments-descending sorting and the default `gt:5` title rule.
2. **Given** a crawl request with `--top-points` and no title filter, **When** the request completes, **Then** one usage record identifies points-descending sorting and no title filter.
3. **Given** a crawl request with `--title-words le:5` and no ranking option, **When** the request completes, **Then** one usage record identifies comments-descending sorting and the `le:5` title rule.
4. **Given** a crawl request whose core operation fails, **When** the request finishes, **Then** one usage record is attempted with the same request start timestamp and elapsed duration, and the existing crawl error behavior is preserved.
5. **Given** usage recording fails for any reason, **When** a crawl succeeds or fails, **Then** the crawler's core result or error behavior is not changed by the tracking failure.

### User Story 2 - View Current Usage History (Priority: P1)

As a crawler user, I want to run `usage` without options or arguments and see the current usage history as JSON, so that I can inspect recorded request activity.

**Why this priority**: Viewing the records is the user-facing value of collecting usage data.

**Independent Test**: In one running process/test context, record multiple requests, invoke `usage` with no options, and verify stdout is a JSON array containing the records in insertion order with the documented fields.

**Acceptance Scenarios**:

1. **Given** no usage records have been recorded in the current process, **When** the user runs `hn-crawler usage`, **Then** stdout contains `[]` and the command exits successfully.
2. **Given** one or more usage records exist in the current process, **When** the user runs `hn-crawler usage`, **Then** stdout contains a JSON array of those records in request order, including request ID, timestamp, applied filters, and duration.
3. **Given** the user supplies an unsupported option or argument to `usage`, **When** the command is run, **Then** the CLI reports its normal argument error and exits non-zero.
4. **Given** the process exits and restarts, **When** the user runs `usage`, **Then** the in-memory history starts empty; persistence across restarts is outside this feature.

### Edge Cases

- A crawl that fails before returning entries still produces a best-effort usage record.
- A failure while recording a usage record must not hide a crawl failure or turn a successful crawl into a failure.
- Duration is measured from request start until the crawl attempt completes, including failed attempts, and is never negative.
- A request with no title filter records that filtering is absent, rather than inventing a title rule.
- When sorting and title filtering are both applied, the applied-filter description identifies both in a deterministic order.
- UUID generation or usage-history retrieval failures are handled without disrupting crawler behavior; retrieval failures are reported by the usage command using the standard command error behavior.
- In-memory history is scoped to the current process and is lost on restart.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST record a usage entry for every crawl request, including requests whose crawl operation fails.
- **FR-002**: Each usage entry MUST include a unique UUIDv7 request ID, a request-start timestamp as UTC Unix milliseconds, an applied-filter description, and duration in milliseconds.
- **FR-003**: Duration MUST be calculated from the start of the crawl request until its success or failure is determined, and MUST be a non-negative integer.
- **FR-004**: The applied-filter description MUST identify the selected descending sort and any title-word filter. Sort labels MUST map `--top-comments` to `sort:number_of_comments:desc` and `--top-points` to `sort:number_of_points:desc`. Title labels MUST map `gt:N` to `sort:title_words:gt:N` and `le:N` to `sort:title_words:le:N`.
- **FR-005**: When a request has both sorting and title filtering, the applied-filter description MUST include both labels in a deterministic order. When no title filter is applied, the description MUST contain only the sort label.
- **FR-006**: Usage tracking MUST be best effort. Failure to create or store a usage entry MUST NOT change a crawl's returned result, replace its original error, or cause a successful crawl to fail.
- **FR-007**: The first implementation MUST keep usage entries in a short-lived in-memory list. Entries MUST remain available for the lifetime of the process and MUST NOT be expected to survive process restart.
- **FR-008**: The CLI MUST expose a `usage` subcommand that accepts no feature-specific options or arguments and prints the current usage entries as a JSON array.
- **FR-009**: The `usage` command MUST print `[]` when no entries have been recorded and MUST return success for that empty history.
- **FR-010**: Usage records MUST be returned in insertion/request order and serialized with the documented record fields; additional persistence-only fields such as an internal identifier MAY be included.
- **FR-011**: Unsupported arguments to `usage` MUST be rejected with a non-zero status using the CLI's standard argument-error behavior.
- **FR-012**: Persistent database, cache, or file storage MUST NOT be added in this feature.
- **FR-013**: Usage tracking MUST NOT alter crawl filtering, ranking, output JSON, URL handling, or existing crawl error messages.

### Key Entities

- **Usage record**: One crawl attempt, containing `request_id` (UUIDv7), `request_timestamp` (UTC Unix milliseconds), `applied_filters` (deterministic string describing sorting and optional title filtering), and `duration_ms` (non-negative integer).
- **Applied filter description**: The selected sorting label and optional title-word rule label. Sort labels are `sort:number_of_comments:desc` or `sort:number_of_points:desc`; title labels are `sort:title_words:gt:N` or `sort:title_words:le:N`.
- **Current usage history**: The ordered list of usage records created during the current process lifetime.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Each attempted crawl request creates exactly one usage record when the tracker is available, whether the crawl succeeds or fails.
- **SC-002**: Every record exposes a UUIDv7 ID, UTC Unix-millisecond request timestamp, deterministic applied-filter description, and non-negative integer duration.
- **SC-003**: A usage-tracking failure leaves the crawl result or original crawl error unchanged.
- **SC-004**: Running `usage` after zero recorded requests returns the JSON array `[]`; after requests, it returns every current-process record in insertion order.
- **SC-005**: No usage record is required to survive a process restart, and no persistent storage is introduced.

## Assumptions

- Each crawl command invocation represents one usage-tracked request, including calls that fail during fetching, filtering, or ranking. CLI argument validation failures that prevent a crawl request from starting are not crawl requests and are not recorded.
- When no options are supplied, the applied-filter description reflects the effective default behavior: comments descending plus title words greater than five.
- When a ranking option is supplied without a title filter, all candidates are eligible and the record contains only the sort label.
- When only `--title-words` is supplied, comments descending is the effective ranking and is included in the applied-filter description.
- The current process's composition root shares one in-memory tracker between crawl recording and usage retrieval.
- The `usage` command emits the four required fields; internal storage fields may remain private and are not required in JSON.
