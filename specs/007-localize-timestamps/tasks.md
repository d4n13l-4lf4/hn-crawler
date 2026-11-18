# Tasks: Localize Usage Timestamps

**Input**: Design documents from `/specs/007-localize-timestamps/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/usage-timestamp.md`, `quickstart.md`

**Tests**: TDD is required. Add deterministic presentation tests before changing the renderer. Refactor black-box Cucumber usage assertions for the changed output contract. Do not change domain, application, infrastructure, or persistence code. Do not run acceptance tests; the user will run them manually.

**Organization**: Tasks are grouped by user story and follow the presentation-only implementation milestones.

## Phase 1: User Story 1 - Read Usage Times in Local Time (Priority: P1) 🎯 MVP

**Goal**: Display each stored UTC-millisecond request timestamp in the system-local timezone, fall back to UTC if local output is unavailable, and label the column `Request Date and Time`.

**Independent Test**: Run table-driven usage CLI unit tests with controlled timezone settings and known timestamps. Verify UTC and non-UTC output, daylight-saving changes, fallback, the new header, table alignment, empty history, and unchanged stored timestamp values.

### Tests for User Story 1

> Write the tests first and confirm expected failures before implementing the formatter.

- [x] T001 [P] [US1] Add table-driven usage output cases for UTC and non-UTC local timestamps, including a daylight-saving boundary, in `tests/unit/presentation/cli/usage.test.ts`
- [x] T002 [P] [US1] Add usage output cases for UTC fallback, the `Request Date and Time` header, and alignment with variable-length formatted timestamps in `tests/unit/presentation/cli/usage.test.ts`
- [x] T003 [US1] Run `npx vitest run tests/unit/presentation/cli/usage.test.ts` and confirm the new timestamp and header expectations fail before implementation

### Implementation for User Story 1

- [x] T004 [US1] Rename the timestamp table header to `Request Date and Time` and format stored Unix milliseconds as local `YYYY-MM-DD HH:mm:ss (TZ)` with UTC fallback in `src/presentation/cli/usage.ts`
- [x] T005 [US1] Preserve timestamp storage values, other table columns, row alignment, empty-history output, CLI argument behavior, and usage error/status behavior in `src/presentation/cli/usage.ts`
- [x] T006 [US1] Run focused usage unit tests, `npm run quality`, and `npm run build`; inspect changed paths to confirm the implementation remains presentation-only

**Checkpoint**: Usage history shows localized timestamps under `Request Date and Time`; unit tests and project gates pass without persistence or non-presentation changes.

## Appended Phase 2: Acceptance Test Contract Refactor

**Goal**: Keep the CLI acceptance suite aligned with the localized usage table output so the suite can remain green after the presentation change.

### Acceptance Refactor Tasks

- [x] T007 [US1] Update persisted-record and empty-history acceptance assertions to expect the `Request Date and Time` header in `tests/acceptance/steps/usage.steps.ts`
- [x] T008 [US1] Add a black-box assertion that usage rows display a `YYYY-MM-DD HH:mm:ss (TZ)` timestamp while accepting the host timezone label, and preserve the alignment assertion in `tests/acceptance/steps/usage.steps.ts`
- [x] T009 [US1] Run `npm run quality` and `npm run build`, inspect the acceptance-test diff for source-artifact independence, and leave `npm run test:acceptance` for the user to run manually

**Checkpoint**: Acceptance usage assertions match the CLI's visible timestamp/header contract; automated acceptance execution is intentionally deferred to the user.

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No dependencies on other user stories.

### User Story Dependencies

- **US1 (P1)**: The only story in this feature and the complete MVP.

### Parallel Opportunities

- T001 and T002 both modify the same usage unit-test file and should be completed together or sequentially to avoid conflicts.
- Implementation and tests share their respective files but are ordered by TDD: tests first, renderer second.

## Implementation Strategy

### MVP First

Complete US1 in one presentation increment: add failing deterministic tests, implement local-time formatting and the header rename, then run focused and full non-acceptance quality gates.

### Incremental Delivery

1. Add timestamp, fallback, header, and alignment tests; demonstrate expected failures.
2. Implement formatting and header changes in the presentation renderer only.
3. Run focused tests, `npm run quality`, and `npm run build`; review scope and results.

## Notes

- All tasks use checklist format with sequential IDs, a story label, and concrete file paths.
- Acceptance test implementation is in scope as the appended milestone; acceptance test execution is deferred to the user for manual verification.
- Do not modify `Usage`, `request_timestamp`, SQLite schema/repository, application use case, configuration, or other CLI commands.
