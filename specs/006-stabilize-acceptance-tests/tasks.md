# Tasks: Stabilize Acceptance Tests

**Input**: Design documents from `/specs/006-stabilize-acceptance-tests/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/acceptance-environment.md`, `quickstart.md`

**Tests**: Follow test-first development for configuration/path changes. Do not run the Cucumber acceptance suite; the user will exercise it manually after implementation.

**Organization**: Tasks are grouped by user story. Each milestone should leave non-acceptance quality gates green and pause for user review.

## Phase 1: User Story 1 - Run Acceptance Tests Against an Isolated Database (Priority: P1)

**Goal**: Ensure explicit database paths isolate acceptance runs while normal CLI use keeps the existing per-user location.

**Independent Test**: Unit tests verify explicit-path selection, fallback behavior, and creation of the explicit path's parent directory. Static review verifies acceptance subprocesses consume the configured path.

### Tests for User Story 1

- [x] T001 [P] [US1] Add config cases asserting non-empty `HN_CRAWLER_DB_PATH` wins, empty/unset values fall back, and legacy `HN_CRAWLER_TEST_DB_PATH` is not used in `tests/unit/config/config.test.ts`
- [x] T002 [P] [US1] Add SQLite path cases asserting the explicit file path is returned and its parent directory is created in `tests/unit/infrastructure/persistence/sqlite/sqlite-path.test.ts`

### Implementation for User Story 1

- [x] T003 [US1] Expose `HN_CRAWLER_DB_PATH` as the configured full DB path and remove/supersede `HN_CRAWLER_TEST_DB_PATH` in `src/config/config.ts`
- [x] T004 [US1] Update `getSqlitePath` to prefer the explicit full DB path and otherwise retain the env-path default in `src/infrastructure/persistence/sqlite/sqlite-path.ts`
- [x] T005 [US1] Update acceptance subprocess environment setup to pass `HN_CRAWLER_DB_PATH` consistently to crawl and usage commands in `tests/acceptance/steps/usage.steps.ts` and `tests/acceptance/steps/crawl.steps.ts`
- [x] T006 [US1] Run focused config/path unit tests and `npm run typecheck`; pause for review

**Checkpoint**: Explicit DB path selection is covered by unit tests; acceptance subprocesses use the same full path contract.

## Phase 2: User Story 2 - Trust Acceptance Results for CLI Errors (Priority: P1)

**Goal**: Make acceptance error assertions reflect Commander and application validation output while checking process status.

**Independent Test**: Static inspection confirms Commander errors assert `error:`, custom validation cases assert their expected messages, and every expected failure checks for a non-zero process status.

### Implementation for User Story 2

- [x] T007 [US2] Keep the Commander `error:` assertion for unknown-option failures and correct crawl argument validation assertions to match their current custom messages plus non-zero status in `tests/acceptance/steps/crawl.steps.ts`
- [x] T008 [US2] Verify each failing crawl scenario in `tests/acceptance/features/crawl.feature` pairs its expected error-output assertion with a non-zero status assertion
- [x] T009 [P] [US2] Remove the obsolete Hello World acceptance feature from `tests/acceptance/features/hello-world.feature`
- [x] T010 [P] [US2] Remove the obsolete Hello World step definitions from `tests/acceptance/steps/hello-world.steps.ts`
- [x] T011 [US2] Inspect remaining Gherkin and step definitions for undefined steps or obsolete Hello World references without executing acceptance tests; pause for review

**Checkpoint**: Acceptance coverage describes current crawl/usage commands; error assertions distinguish Commander output from custom validation output.

## Phase 3: User Story 3 - Keep Acceptance Scenarios Aligned With the CLI (Priority: P2)

**Goal**: Generate and export a unique CI database path before the acceptance suite starts, without changing the existing acceptance URL or beta setup.

**Independent Test**: Static workflow inspection confirms a unique temporary full DB path is generated before test execution, exported for child processes, and existing URL preflight and beta variables remain configured.

### Implementation for User Story 3

- [x] T012 [US3] Add an acceptance workflow step that creates a unique temporary SQLite file path and appends `HN_CRAWLER_DB_PATH` to `GITHUB_ENV` before the test step in `.github/workflows/acceptance-tests.yml`
- [x] T013 [US3] Preserve the existing `HN_CRAWLER_ACCEPTANCE_URL` validation and `HN_CRAWLER_BETA` mapping while making the generated path available to `npm run test:acceptance` and spawned CLI processes in `.github/workflows/acceptance-tests.yml`
- [x] T014 [US3] Update the manual acceptance command and expected setup to use `HN_CRAWLER_DB_PATH` in `specs/006-stabilize-acceptance-tests/quickstart.md`
- [x] T015 [US3] Run all focused tests, `npm run quality`, and `npm run build`; statically inspect workflow changes, do not execute acceptance tests, and pause for user manual acceptance review

**Checkpoint**: CI prepares an isolated DB path; quality and build are green; acceptance remains unrun for the user.

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: Establishes the DB path contract required by acceptance subprocesses and CI.
- **Phase 2 (US2)**: Independent of the DB path implementation; may proceed after initial review or in parallel on separate acceptance files.
- **Phase 3 (US3)**: Depends on US1's environment variable name and precedence; final workflow wiring can follow the DB path milestone.

### User Story Dependencies

- **US1 (P1)**: Required before CI can reliably isolate the database.
- **US2 (P1)**: Independent acceptance contract cleanup; no application changes.
- **US3 (P2)**: Depends on US1's `HN_CRAWLER_DB_PATH` contract; includes workflow setup and manual validation guidance.

### Parallel Opportunities

- T001 and T002 modify separate unit test files and can be authored together.
- T011 and T012 remove separate obsolete acceptance artifacts and can proceed together.
- US2 acceptance cleanup can proceed separately from US1 implementation once the shared `HN_CRAWLER_DB_PATH` naming is established.

## Implementation Strategy

### MVP First

Complete US1 first so explicit path configuration and fallback behavior are tested and implemented. Review the isolated-path contract before applying it to acceptance subprocesses and CI.

### Incremental Delivery

1. Add failing config/path unit tests and implement `HN_CRAWLER_DB_PATH` precedence; run focused gates and pause for review.
2. Fix acceptance error assertions and remove obsolete Hello World acceptance files; inspect without executing acceptance and pause for review.
3. Generate/export the CI temporary path, update manual instructions, and run the complete non-acceptance quality gates/build. Leave acceptance execution to the user.

## Notes

- All task lines use checklist format with sequential IDs, story labels where applicable, and concrete file paths.
- Acceptance tests are intentionally not run during implementation.
- Do not alter `HN_CRAWLER_ACCEPTANCE_URL`, crawl semantics, domain rules, or SQLite schema.
- The generated CI path must be unique to the workflow run and must not point at the normal user data database.
