# Feature Specification: Stabilize Acceptance Tests

**Feature Branch**: `006-stabilize-acceptance-tests`
**Created**: 2026-11-18
**Status**: Draft
**Input**: Technical debt story to make acceptance tests reliable with consistent CLI error assertions, current command scenarios, and an isolated database location.

## User Scenarios & Testing

### User Story 1 - Run Acceptance Tests Against an Isolated Database (Priority: P1)

As a maintainer, I want each acceptance workflow run to use a fresh, explicit database path, so that persisted usage data from other runs or a developer's machine cannot affect test results.

**Why this priority**: Usage history is persistent. An isolated path makes acceptance results repeatable and prevents tests from reading or changing a user's normal database.

**Independent Test**: Start the CLI with a configured database path and verify usage data is written to and read from that location; verify that when no explicit path is configured, the existing user data location is used.

**Acceptance Scenarios**:

1. **Given** an explicit full database path is configured, **When** the CLI starts, **Then** it uses that path instead of the default user data location.
2. **Given** no explicit database path is configured, **When** the CLI starts, **Then** it uses the normal application user data location.
3. **Given** the acceptance workflow is about to run the test suite, **When** it prepares the test environment, **Then** it creates and exports a unique temporary database path for the acceptance subprocesses.

### User Story 2 - Trust Acceptance Results for CLI Errors (Priority: P1)

As a maintainer, I want acceptance checks to recognize the CLI's documented error prefix and verify process status, so that validation failures are distinguished from successful runs.

**Why this priority**: Error scenarios must check both the output contract and the actual command result.

**Independent Test**: Run representative invalid CLI invocations and confirm the acceptance checks require the expected `error:` prefix and a non-zero process status.

**Acceptance Scenarios**:

1. **Given** Commander reports an invalid command option, **When** the acceptance step checks stderr, **Then** it recognizes the `error:` prefix and also asserts a non-zero process status.
2. **Given** a crawl argument validation scenario is expected to fail, **When** the acceptance step checks the result, **Then** it checks for the `error:` prefix and non-zero status.

### User Story 3 - Keep Acceptance Scenarios Aligned With the CLI (Priority: P2)

As a maintainer, I want acceptance scenarios to describe commands that the current CLI supports, so that the suite does not fail on obsolete behavior.

**Why this priority**: Stale acceptance scenarios create false failures and obscure regressions in supported behavior.

**Independent Test**: Inspect and execute the acceptance suite against the installed CLI; no scenario should expect the removed Hello World behavior.

**Acceptance Scenarios**:

1. **Given** the current CLI exposes crawl and usage commands, **When** the acceptance suite runs, **Then** it contains no legacy Hello World feature or steps.

## Edge Cases

- An explicit DB path points to a file in a directory that does not yet exist; the CLI must retain its existing directory-creation behavior.
- The configured acceptance database path is missing or empty; the workflow must assign a valid unique temporary path before running the suite.
- A Commander-generated error occurs; the assertion must require its `error:` prefix and a non-zero exit status.
- The default user data location contains existing history; acceptance tests must not access or modify it when an explicit path is configured.

## Requirements

### Functional Requirements

- **FR-001**: The CLI MUST accept `HN_CRAWLER_DB_PATH` as a full database file path.
- **FR-002**: When `HN_CRAWLER_DB_PATH` is present and non-empty, it MUST take precedence over the normal application user data location.
- **FR-003**: When `HN_CRAWLER_DB_PATH` is absent or empty, the CLI MUST use its normal cross-platform user data location.
- **FR-004**: The acceptance workflow MUST generate a unique temporary full database path in a step before running acceptance tests and expose it to the test process as `HN_CRAWLER_DB_PATH`.
- **FR-005**: Acceptance assertions for Commander-generated errors MUST check for the `error:` prefix and the expected non-zero process status.
- **FR-006**: The acceptance suite MUST NOT contain the obsolete Hello World feature or its associated steps.
- **FR-007**: The acceptance suite MUST remain a black-box test of the installed CLI process and MUST verify expected output and exit status for success and failure scenarios.
- **FR-008**: The completed acceptance suite and project quality gates MUST pass.

### Key Entities

- **Acceptance database path**: A full filesystem path dedicated to one acceptance workflow run, isolated from normal user data.
- **CLI process result**: The command's output streams and process exit status used to verify success or failure behavior.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every acceptance workflow run uses a unique database file path and does not read or modify the normal user database.
- **SC-002**: Explicit database path configuration selects that location; without it, the normal user data location remains selected.
- **SC-003**: All Commander error scenarios require the `error:` prefix and a non-zero exit status.
- **SC-004**: No acceptance scenario expects the obsolete Hello World behavior.
- **SC-005**: The full acceptance suite and project quality gates complete successfully.

## Assumptions

- The acceptance workflow continues to use the repository-configured `HN_CRAWLER_ACCEPTANCE_URL` and beta flag as currently defined.
- The acceptance URL source is intentionally unchanged by this feature; local deterministic fixture serving is outside this scope.
- The generated database path is temporary test configuration and does not change the normal user-facing database location.
- No production CLI commands or crawl behavior are otherwise changed.
