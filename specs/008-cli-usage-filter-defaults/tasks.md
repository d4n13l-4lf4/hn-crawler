# Tasks: CLI Usage and Filter Defaults

**Input**: Design documents from `/specs/008-cli-usage-filter-defaults/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-command.md, quickstart.md

**Testing**: Test-first unit work is required. Unit cases are table-driven and use `it should when` wording. Acceptance scenarios and steps are already refactored, may fail against current production code, and must not be run by the agent. Each implementation milestone ends with a passing `npm run quality` gate before user review. The user runs acceptance manually after implementation. No acceptance scenario is added for version reporting.

**Organization**: Tasks are ordered by review milestone. Stop for user review after each completed milestone and do not proceed until the user confirms.

## Format: `[ID] [P?] [Story] Description`

- `[P]` marks work that can proceed in parallel without file conflicts or incomplete prerequisites.
- `[US#]` identifies the user story.
- Every task names concrete project paths.

## Phase 1: Acceptance Refactor (Completed Review Milestone 1)

**Purpose**: Define the new black-box behavior before production changes. These acceptance checks may fail until implementation is complete and were intentionally not run.

- [x] T001 [US1] Replace the old no-option default-filter scenario with source-order, first-30, fewer-than-30, and `none` usage expectations in `tests/acceptance/features/crawl.feature` and `tests/acceptance/features/usage.feature`
- [x] T002 [US1] Add acceptance scenarios for filter-only source-order output and ranking-only behavior in `tests/acceptance/features/crawl.feature`
- [x] T003 [US2] Update applied-filter expectations to use `filter:title_words:<comparator>:<limit>` while retaining selected ranking `sort:` labels in `tests/acceptance/features/usage.feature`
- [x] T004 [US1] Add steps for asserting source-order crawl output in `tests/acceptance/steps/crawl.steps.ts`
- [x] T005 [US1] Add steps for checking persisted `none` and revised filter descriptions in `tests/acceptance/steps/usage.steps.ts`

**Checkpoint**: Complete. Acceptance edits are in the worktree; Cucumber remains unrun.

## Phase 2: User Stories 1 and 2 - Complete Crawl and Usage Vertical Slice (Remaining Review Milestone 2)

**Goal**: Implement no-option and partial-option crawl semantics together with truthful usage recording and display. This whole phase is one reviewable, green increment; do not split its dependent behavior into separate reviews.

**Independent Test**: Unit tests cover no operations, filter-only, ranking-only, and combined behavior; verify usage strings, table display, and SQLite round-trip. `npm run quality` passes. Acceptance is reserved for user-run final validation.

### Tests First

- [x] T006 [P] [US1] Update `tests/unit/application/usecases/crawler.usecase.test.ts` with table-driven `it should when` cases for the bounded first-30 candidate set and unchanged source input when no operations are selected
- [x] T007 [P] [US1] Update `tests/unit/application/pipeline/factory/factory.test.ts` with table-driven `it should when` cases for passthrough, filter-only source order, ranking-only, and filter-then-ranking behavior
- [x] T008 [P] [US1] Update `tests/unit/presentation/cli/crawl.test.ts` with table-driven `it should when` cases for omitted options, filter-only, ranking-only, and combined option normalization
- [x] T009 [P] [US2] Update `tests/unit/domain/vo/applied-filters.vo.test.ts` with table-driven `it should when` cases for `none`, ranking labels, filter labels, and combined labels
- [x] T010 [P] [US2] Update `tests/unit/application/mappers/applied-filters.mapper.test.ts` with table-driven `it should when` cases mapping all optional request combinations
- [x] T011 [P] [US2] Update tracked-crawler and SQLite repository unit cases for truthful request mapping and persisted strings in `tests/unit/application/usecases/decorators/tracked-crawler.usecase.test.ts` and `tests/unit/infrastructure/persistence/sqlite/repositories/usage.repository.test.ts`
- [x] T012 [US2] Verify usage display presents `none` and revised descriptions unchanged in `tests/unit/presentation/cli/usage.test.ts`

### Implementation

- [x] T013 [US1] Make ranking optional in `CrawlRequest` and `PipelineFactory` contracts in `src/application/ports/in/crawler.port.ts`
- [x] T014 [US1] Normalize only explicitly supplied ranking and title-word flags in `src/presentation/cli/crawl.ts`
- [x] T015 [US1] Compose only selected filter/ranking steps and preserve source order when ranking is absent in `src/application/pipeline/factory/factory.ts`
- [x] T016 [US1] Pass the selected optional choices through the bounded crawl use case in `src/application/usecases/crawler.usecase.ts`
- [x] T017 [US2] Allow absent ranking/filter choices and format `none`, ranking `sort:` labels, and title `filter:` labels in `src/domain/vo/applied-filters.vo.ts`
- [x] T018 [US2] Map optional request choices to applied usage descriptions in `src/application/mappers/applied-filters.mapper.ts`
- [x] T019 [US2] Ensure usage tracking records the actual request without injecting defaults in `src/application/usecases/decorators/tracked-crawler.usecase.ts`
- [x] T020 [US2] Confirm SQLite persists and restores the applied description as text without a schema migration in `src/infrastructure/persistence/sqlite/repositories/usage.repository.ts`
- [x] T021 [US1] Remove obsolete expectations for implicit `gt:5`/comments defaults from the affected crawl command and pipeline unit tests in `tests/unit/presentation/cli/crawl.test.ts` and `tests/unit/application/pipeline/factory/factory.test.ts`
- [x] T022 [US1] Run focused crawl, pipeline, tracked-usage, mapper, value-object, usage-display, and SQLite repository unit tests in `tests/unit/`; fix all failures within the vertical slice
- [x] T023 [US1] Run `npm run quality` and resolve all failures before presenting the milestone

**Checkpoint**: The no-option/partial-option crawl behavior and matching usage behavior work together; the complete quality gate passes. Present for review only after T023 passes.

## Phase 3: User Story 3 - Dynamic Package Version (Remaining Review Milestone 3)

**Goal**: The CLI version comes from package metadata and has unit coverage only.

**Independent Test**: `tests/unit/presentation/cli/cli.test.ts` verifies the CLI version matches the current package metadata; no acceptance scenario is added. `npm run quality` passes.

### Tests First

- [ ] T024 [US3] Replace the fixed-version expectation with table-driven `it should when` coverage tied to package metadata in `tests/unit/presentation/cli/cli.test.ts`

### Implementation

- [ ] T025 [US3] Register the package metadata version in Commander without a duplicate literal in `src/presentation/cli/cli.ts`
- [ ] T026 [US3] Run focused CLI unit tests, then run `npm run quality`; present the milestone only when the aggregate gate passes

**Checkpoint**: Dynamic version display is independently reviewable and all quality gates pass.

## Phase 4: User-Run Manual Acceptance

**Purpose**: User executes the refactored acceptance suite after approving implementation milestones.

- [ ] T027 [US1] User runs acceptance using the configured deterministic page and instructions in `specs/008-cli-usage-filter-defaults/quickstart.md`
- [ ] T028 [US1] Address user-reported acceptance failures in a focused follow-up change and leave `npm run quality` passing in affected `tests/acceptance/`, `src/`, and `tests/unit/` files

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** is complete. Its acceptance checks remain unrun by the agent.
- **Phase 2** is the next implementation milestone. Tests are added first; crawl and usage changes are implemented as one vertical slice because the crawl request and truthful usage record share optional choices. The phase is not review-ready until `npm run quality` passes.
- **Phase 3** starts only after approval of Phase 2 and is isolated to package version presentation and its unit coverage.
- **Phase 4** occurs after approval of Phases 2 and 3; acceptance execution belongs to the user.

### User Story Dependencies

- **US1 (P1)** and **US2 (P2)** are coupled in Phase 2: `none` is only truthful when crawl normalization, pipeline execution, usage mapping, persistence, and display agree.
- **US3 (P3)** is independent and scheduled as its own later review milestone.

### Parallel Opportunities

- T006–T011 touch different unit files and can be authored in parallel before production changes, subject to the user’s single-milestone review boundary.
- T013–T020 are dependent implementation changes and should be performed sequentially where types or behavior flow between layers.
- T024 and T025 are sequential TDD steps in one file and must remain ordered.

## Implementation Strategy

1. Acceptance refactor is already complete and intentionally unrun.
2. Complete the crawl and usage vertical slice with tests first, then implementation; run `npm run quality` and stop for review only when green.
3. After approval, implement dynamic package version with unit coverage and run `npm run quality`; stop for review only when green.
4. After approval, the user manually runs acceptance. Keep Cucumber unexecuted by the agent.

## Notes

- Never stop at a type-incompatible intermediate API change. Complete the dependent usage mapping/value-object changes in the same milestone.
- A review milestone must add user-visible functionality or complete an independently useful maintenance change and must pass `npm run quality`.
- The acceptance suite may be behavior-red until the user runs it after implementation; this is intentional and distinct from the required green unit/quality gate.
- No schema change or new production abstraction is planned.
