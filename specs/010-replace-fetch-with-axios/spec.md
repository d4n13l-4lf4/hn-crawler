# Feature Specification: Resilient HTTP Client with Timeout and Retry

**Feature Branch**: `[010-replace-fetch-with-axios]`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Implement some technical debt improvements: Use axios as the new HTTP client library for our hn HTTP client. This will replace our current fetch implementation helping us to improve timeout, error handling and retries. For this, we will configure a timeout of 15 seconds (parameterized) with a retrying mechanism of server errors only up to 3 times with a pause of 3 seconds between each retry (parameterizable both number of retries and seconds between retry). So, acceptance tests won't change and we will keep the functional behavior as the requirements establish right now. No acceptance tests will be implemented or automatically run for this feature."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Preserve Crawl Behavior with Resilient HTTP Requests (Priority: P1)

As a crawler user, I want HN entry crawls to return the same first 30 entries (rank, title, points, comments) with identical filtering, ranking, and usage behavior as before, while HTTP requests to the source page are resilient to transient network issues through timeouts and retries, so that my existing workflows and acceptance tests continue to pass unchanged.

**Why this priority**: The requirement explicitly keeps functional behavior unchanged; preserving behavior is the non-negotiable outcome of this technical debt work.

**Independent Test**: Run the CLI against the same deterministic page before and after the change and verify identical crawl output (up to 30 entries), filtering, ranking, usage records, and exit behavior; run the existing acceptance suite and verify every scenario still passes without modification; verify HTTP requests apply the configured timeout and retry on server errors.

**Acceptance Scenarios**:

1. **Given** the refactored HTTP client, **When** the user runs a crawl with no options, **Then** the command returns the first 30 available entries in original page order with the applied filter recorded as `none`, exactly as before the change.
2. **Given** a crawl with a title-word filter, **When** the user runs the command, **Then** entries are filtered by the same word-count rule as before the change.
3. **Given** a crawl with ranking by comments or points, **When** the user runs the command, **Then** entries are reordered in descending order by the selected metric exactly as before the change.
4. **Given** the existing acceptance suite, **When** it is run against the changed crawler, **Then** every scenario passes unchanged with no scenario added, removed, or modified.

---

### User Story 2 - Configure HTTP Timeout and Server-Error Retries (Priority: P2)

As a crawler maintainer, I want HTTP requests to the Hacker News page to apply a configurable timeout and to automatically retry only on server errors up to a configurable number of times with a configurable pause between attempts, so that transient server failures are handled gracefully without failing the crawl or requiring manual intervention.

**Why this priority**: Improving timeout and retry handling is the purpose of this technical debt work; it makes crawls more resilient to transient network and server issues.

**Independent Test**: Verify that HTTP requests respect the configured timeout, that server errors trigger retries up to the configured limit with the configured pause between attempts, and that non-server errors are not retried; confirm these values are parameterizable.

**Acceptance Scenarios**:

1. **Given** an HTTP request times out beyond the configured limit, **When** the crawl runs, **Then** the request is aborted after the timeout and handled as an error.
2. **Given** the source server returns a server error response, **When** the crawl runs, **Then** the request is retried up to the configured number of times with the configured pause between attempts before being treated as failed.
3. **Given** the source server returns a client error or other non-server error response, **When** the crawl runs, **Then** the request is not retried and is handled as an error.

### Edge Cases

- Fewer than 30 entries are available on the source page.
- A title-word filter excludes all entries, returning an empty result set.
- Ranking is requested when no entries match the filter or no entries exist.
- Missing points or comments values (for example, job posts) count as 0, as before the change.
- Ties in ranking keep the original Hacker News rank order, as before the change.
- A timeout occurs before any response is received.
- A server error persists beyond the configured retry limit, so the crawl fails after exhausting retries.
- A non-server error (for example, a client error) occurs and is not retried.
- The pause between retries is applied consistently across retry attempts.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: A crawl MUST return up to the first 30 Hacker News entries with rank, title, points, and comments exactly as before the change.
- **FR-002**: Title-word filtering (`gt` and `le`) MUST retain the same word-count filtering semantics as before the change.
- **FR-003**: Ranking by comments or points MUST retain the same descending ordering semantics as before the change.
- **FR-004**: A crawl with no filtering or ranking options MUST record its applied filter as `none`.
- **FR-005**: Existing acceptance scenarios MUST continue to describe the same preserved behavior — no scenario added, removed, or modified for this feature.
- **FR-006**: HTTP requests to the source page MUST apply a configurable timeout; requests exceeding the timeout MUST be aborted and handled as errors.
- **FR-007**: HTTP requests MUST be retried only on server errors, up to a configurable number of times, with a configurable pause between retry attempts.
- **FR-008**: HTTP requests MUST NOT be retried on non-server errors (for example, client errors).
- **FR-009**: The timeout value, maximum retry count, and pause between retries MUST be parameterizable (for example, 15 seconds timeout, 3 retries, 3 seconds pause).
- **FR-010**: The HTTP client change MUST introduce no new user-facing commands, options, or output formats.

### Key Entities

- **Crawl result**: Up to 30 Hacker News entries, each with rank, title, points, and comments, plus the applied-filter description.
- **HTTP request timeout**: The maximum time allowed for an HTTP request to complete before it is aborted and handled as an error.
- **Server-error retry**: An automatic re-attempt of an HTTP request that received a server error response, bounded by a configurable maximum count and spaced by a configurable pause.
- **Acceptance scenario**: A description of expected behavior; no acceptance tests are implemented or automatically run for this feature.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Crawl output for up to 30 entries (rank, title, points, comments) is identical to pre-change output on the same deterministic page, for every supported combination of no options, title-word filtering, and ranking.
- **SC-002**: Usage records (applied filter, entries scraped, entries returned) match pre-change records for the same crawl inputs.
- **SC-003**: 100% of existing acceptance scenarios pass unchanged after the HTTP client change.
- **SC-004**: HTTP requests exceeding the configured timeout are aborted and handled as errors in 100% of timeout cases.
- **SC-005**: Server-error responses trigger retries up to the configured maximum count with the configured pause between attempts in 100% of server-error cases.
- **SC-006**: Non-server-error responses are not retried in 100% of such cases.

## Assumptions

- The functional requirements for crawl output, title-word filtering, ranking, and usage tracking remain exactly as established before the change.
- Existing acceptance scenarios from prior features remain the source of truth for expected crawler behavior; none are added, removed, or automatically executed for this feature.
- No acceptance tests will be implemented or automatically run for this feature.
- The refactor introduces no new user-facing commands, options, or output formats.
- A dedicated HTTP client library is used to replace the native fetch implementation, as requested.
- Default resilience values are a 15-second timeout, up to 3 retries on server errors, and a 3-second pause between retries; all three are parameterizable.
