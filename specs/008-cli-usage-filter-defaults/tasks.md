# Tasks: CLI Usage and Filter Defaults

**Input**: Design documents from `/specs/008-cli-usage-filter-defaults/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-command.md, quickstart.md

**Testing**: TDD is required. Acceptance scenarios and step definitions are refactored first and may fail against the current implementation by design; do not run them. Unit tests are table-driven and use `it should when` wording. Run focused unit tests and applicable non-acceptance quality gates for each implementation milestone. The user runs acceptance manually after all milestones. No acceptance scenario is added for version display.

**Organization**: Tasks are grouped by user story and ordered by the requested incremental review milestones. Pause for user review after each milestone before proceeding.

## Format: `[ID] [P?] [Story] Description`

- `[P]` marks tasks that can be completed in parallel without editing the same files or depending on incomplete tasks.
- `[US#]` maps a task to its user story.
- Every task names the relevant file path.

## Phase 1: Acceptance Scenarios and Step Definitions (Review Milestone 1)

**Purpose**: Refactor black-box acceptance coverage first. These checks are expected to fail against current production behavior; do not run them in this milestone.

- [ ] T001 [US1] Replace the old no-option default-filter scenario with scenarios asserting source-order output, up-to-30 behavior, fewer-than-30 behavior, and usage marker `none` in `tests/acceptance/features/crawl.feature` and `tests/acceptance/features/usage.feature`
- [ ] T002 [US1] Add acceptance scenarios for filter-only source-order output and ranking-only output in `tests/acceptance/features/crawl.feature`
- [ ] T003 [US2] Update acceptance expectations for title-word usage descriptions to `filter:title_words:<comparator>:<limit>` while retaining `sort:<metric>:desc` for explicit ranking in `tests/acceptance/features/usage.feature`
- [ ] T004 [US1] Add or adapt acceptance step definitions to capture no-option crawl output and assert source-order preservation in `tests/acceptance/steps/crawl.steps.ts`
- [ ] T005 [US1] Add or adapt acceptance steps to share a temporary database between crawl and usage checks and assert `none` in `tests/acceptance/steps/usage.steps.ts`

**Checkpoint**: Review the edited acceptance features and steps. Do not run Cucumber; expected failures against current behavior are intentional.

## Phase 2: User Story 1 - No-Option Crawl Preserves Source Order (Priority: P1)

**Goal**: A crawl without filter or ranking options returns up to the first 30 entries unchanged and records `none`.

**Independent Test**: Unit tests prove no-option requests pass the first 30 entries through unchanged and usage mapping produces `none`; manual acceptance later verifies output and persisted usage.

### Tests First

- [ ] T006 [US1] Add table-driven `it should when` cases for no-option request normalization and explicit option combinations in `tests/unit/presentation/cli/crawl.test.ts`
- [ ] T007 [US1] Add table-driven `it should when` cases for no-operation, filter-only, ranking-only, and combined pipeline behavior in `tests/unit/application/pipeline/factory/factory.test.ts`
- [ ] T008 [US1] Add table-driven `it should when` cases proving first-30 source selection and passthrough when no operation is selected in `tests/unit/application/usecases/crawler.usecase.test.ts`

### Implementation

- [ ] T009 [US1] Make `sortBy` optional in `CrawlRequest` and `PipelineFactory` configuration in `src/application/ports/in/crawler.port.ts`
- [ ] T010 [US1] Update crawl option normalization to omit absent filter and ranking choices in `src/presentation/cli/crawl.ts`
- [ ] T011 [US1] Compose only selected operations and pass entries through in source order when none are selected in `src/application/pipeline/factory/factory.ts`
- [ ] T012 [US1] Ensure the use case applies the updated optional pipeline configuration while limiting source retrieval to the first 30 entries in `src/application/usecases/crawler.usecase.ts`
- [ ] T013 [US1] Run the focused crawl command, pipeline factory, and crawler use-case unit tests; resolve failures before presenting the milestone

**Checkpoint**: Present the P1 behavior and tests for review with focused unit tests green.

## Phase 3: User Story 2 - Accurate Applied-Filter Usage (Priority: P2)

**Goal**: Usage displays `none` without operations, keeps existing sort labels for selected ranking, and uses `filter:` for title rules.

**Independent Test**: Unit tests verify descriptions for none, sort-only, filter-only, and combined choices; persistence tests verify strings round-trip unchanged. Manual acceptance later checks displayed usage.

### Tests First

- [ ] T014 [US2] Add table-driven `it should when` mapping cases for none, ranking-only, filter-only, and combined usage descriptions in `tests/unit/application/mappers/applied-filters.mapper.test.ts`
- [ ] T015 [US2] Add table-driven `it should when` value-object cases for the `none`, `sort:`, and `filter:` descriptions in `tests/unit/domain/vo/applied-filters.vo.test.ts`
- [ ] T016 [US2] Add or adjust SQLite repository cases for round-tripping `none` and revised filter labels in `tests/unit/infrastructure/persistence/sqlite/repositories/usage.repository.test.ts`

### Implementation

- [ ] T017 [US2] Update `AppliedFilters` to allow no operations, emit `none`, retain ranking `sort:` labels, and use `filter:title_words:` for title rules in `src/domain/vo/applied-filters.vo.ts`
- [ ] T018 [US2] Map optional request choices to the applied-filter value in `src/application/mappers/applied-filters.mapper.ts`
- [ ] T019 [US2] Ensure tracked crawl usage is built from the request choices without inserting implicit defaults in `src/application/usecases/decorators/tracked-crawler.usecase.ts`
- [ ] T020 [US2] Run focused applied-filter mapper, value-object, tracked-crawler, usage CLI, and SQLite repository unit tests; resolve failures before presenting the milestone

**Checkpoint**: Present usage values and persistence behavior for review with focused unit tests green.

## Phase 4: User Story 3 - CLI Displays Package Version (Priority: P3)

**Goal**: The CLI version output follows the package metadata without a separately maintained literal.

**Independent Test**: Unit tests verify the version registered by `createCli` matches the package version; no acceptance scenario is added.

### Tests First

- [ ] T021 [US3] Replace the fixed-version assertion with table-driven `it should when` coverage tied to package metadata in `tests/unit/presentation/cli/cli.test.ts`

### Implementation

- [ ] T022 [US3] Source the Commander version from package metadata in `src/presentation/cli/cli.ts` without adding a duplicate version constant
- [ ] T023 [US3] Run focused CLI unit tests and confirm version behavior has no acceptance scenario

**Checkpoint**: Present the package-version change for review with focused unit tests green.

## Phase 5: Integration and Quality Gates

**Purpose**: Remove obsolete assumptions, confirm full unit coverage, and prepare the user-run acceptance suite.

- [ ] T024 [P] Remove superseded default-filter/default-ranking expectations from affected unit tests and descriptions in `tests/unit/presentation/cli/crawl.test.ts`, `tests/unit/application/pipeline/factory/factory.test.ts`, and `tests/unit/application/mappers/applied-filters.mapper.test.ts`
- [ ] T025 [P] Confirm the usage table displays `AppliedFilters.toString()` output unchanged for `none` and revised labels in `tests/unit/presentation/cli/usage.test.ts`
- [ ] T026 Run full unit coverage, formatting check, lint, and typecheck using the scripts documented in `docs/QA.md`; resolve all failures before final review
- [ ] T027 Review `specs/008-cli-usage-filter-defaults/quickstart.md` against the completed code and update it if manual acceptance setup or expected results changed
- [ ] T028 Present the final implementation milestone and remind the user that acceptance scenarios are intentionally unrun and ready for their manual execution

**Checkpoint**: All non-acceptance quality gates pass; user reviews before manually running acceptance.

## Phase 6: User-Run Manual Acceptance

**Purpose**: The user executes the intentionally refactored acceptance suite after approving all implementation milestones.

- [ ] T029 [US1] User runs the acceptance suite against the configured deterministic page using the instructions in `specs/008-cli-usage-filter-defaults/quickstart.md`
- [ ] T030 [US1] Review any user-reported acceptance failures and create a follow-up implementation milestone in the relevant `tests/acceptance/` and `src/` files

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: First; edits acceptance expectations and steps only, and intentionally may leave those checks failing against current production behavior.
- **Phase 2 (US1)**: Begins after user review of Phase 1; implements crawl request and pipeline semantics.
- **Phase 3 (US2)**: Depends on Phase 2 request semantics; makes applied-filter descriptions and persistence consistent with actual choices.
- **Phase 4 (US3)**: Independent in code but scheduled after US1 and US2 to preserve the requested small review cadence.
- **Phase 5**: Depends on Phases 2–4.
- **Phase 6**: User-run only after implementation review and Phase 5.

### User Story Dependencies

- **US1 (P1)**: Acceptance edits first, then crawl option, use-case, and pipeline updates.
- **US2 (P2)**: Depends on US1's optional request semantics so usage maps actual selected operations.
- **US3 (P3)**: Independent of crawl and usage behavior, but kept as its own review milestone.

### Parallel Opportunities

- T001 and T002 concern the same feature file and should be done together despite separate requirement traceability.
- T004 and T005 touch separate step files and can be parallelized after the feature grammar in T001–T003 is agreed.
- T006–T008 touch separate unit files and can be authored in parallel before implementation, then run together.
- T014–T016 touch separate unit files and can be authored in parallel before the domain implementation.
- T021 can be prepared independently but should remain in its own review milestone.
- T024 and T025 touch separate test files and can be done in parallel before final gates.

## Parallel Example: User Story 1

```text
Task: T006 update tests/unit/presentation/cli/crawl.test.ts
Task: T007 update tests/unit/application/pipeline/factory/factory.test.ts
Task: T008 update tests/unit/application/usecases/crawler.usecase.test.ts
```

The acceptance tasks T001–T005 must precede implementation and the acceptance suite remains unrun until the user reaches Phase 6.

## Implementation Strategy

### MVP First

The P1 no-option crawl is the first functional milestone after acceptance artifacts are reviewed. Keep its unit suite green before moving on to usage formatting and package version work.

### Incremental Delivery

1. Refactor acceptance scenarios/steps and stop for review; expected mismatch with current code is intentional.
2. Implement no-option crawl behavior test-first; run unit tests and stop for review.
3. Implement usage descriptions and persistence round-trip test-first; run unit tests and stop for review.
4. Implement dynamic package version test-first; run unit tests and stop for review.
5. Run full non-acceptance quality gates and present final implementation for review.
6. User manually runs acceptance after approving implementation.

## Notes

- Each implementation milestone begins with failing unit tests and ends with the focused unit suite and relevant non-acceptance quality gates green.
- User approval is required before advancing to the next milestone; do not batch all milestones into one implementation pass.
- Do not execute Cucumber acceptance tests; the user will run them manually at the end.
- The version requirement has unit coverage only and no acceptance scenario.
