# Tasks: Filter and Sort Hacker News Stories

**Input**: Design documents from `/specs/003-filter-sort-stories/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/crawl-cli.md`

**Tests**: Required by the spec and project TDD rules. Acceptance scenarios are written first but MUST NOT be run until the final verification task. Unit tests and non-acceptance quality gates run at their story checkpoints.

**Organization**: Tasks are grouped by the two user stories, with shared pipeline and domain prerequisites first. Each implementation milestone is a review checkpoint; stop for user review before continuing.

## Phase 1: Setup

**Purpose**: No project initialization is needed; the TypeScript CLI, test tools, and feature scaffolding already exist.

- [x] T001 Review the acceptance URL environment variable and standalone CLI invocation in `tests/acceptance/steps/crawl.steps.ts` and `package.json` without running acceptance tests

## Phase 2: Foundational Pipeline Components

**Purpose**: Establish generic async stream types and operators required by the crawler feature.

- [x] T002 [P] Define AsyncIterable-only `AsyncStep` and operator types in `src/application/pipeline/pipeline.types.d.ts`
- [x] T003 [P] Add the async pipe orchestrator in `src/application/pipeline/orchestrator/async.pipe.ts`
- [x] T004 [P] Add lazy async-generator `filter` operator in `src/application/pipeline/operators/filter.ts`
- [x] T005 [P] Add stable bounded descending `topK` operator in `src/application/pipeline/operators/top-k.ts`
- [x] T006 Add table-driven pipe tests for ordered composition, empty steps, source propagation, and failure propagation in `tests/unit/application/pipeline/orchestrator/async.pipe.test.ts`
- [x] T007 Add table-driven filter tests for matching, no matches, laziness, early termination, and errors in `tests/unit/application/pipeline/operators/filter.test.ts`
- [x] T008 Add table-driven top-K tests for descending order, window size, empty input, ties preserving source order, missing/zero scores, and source errors in `tests/unit/application/pipeline/operators/top-k.test.ts`
- [x] T009 Remove superseded pipe implementation and tests from `src/application/pipeline/orchestration/pipe.ts` and `tests/unit/application/pipeline/orchestration/pipe.test.ts`, and remove obsolete helpers/types only after confirming they have no remaining references
- [x] T010 Run focused pipeline unit tests plus `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run test:coverage`; pause for review before the next milestone

**Checkpoint**: Async pipeline foundations and gates are green; acceptance tests remain unrun.

## Phase 3: User Story 1 - Filter and Sort Stories (Priority: P1) 🎯 MVP

**Goal**: Let users filter the first 30 retrieved stories by title word count and rank them by comments or points, with the required defaults and CLI error behavior.

**Independent Test**: Using deterministic entries and the CLI contract, verify each filter/ranking combination, defaults, output JSON, edge cases, and non-zero errors. Unit tests and quality gates are run at each milestone; acceptance tests are only run in the final phase.

### Milestone A: Acceptance scenarios written first (do not run)

- [x] T011 [P] [US1] Add black-box Cucumber scenarios for all supported filter/ranking combinations, defaults, output shape/order, and no-match output in `tests/acceptance/features/crawl.feature`
- [x] T012 [P] [US1] Add black-box Cucumber scenarios for conflicting flags, invalid title-word arguments, exact maximum message, crawler failure message, and actual process exit status in `tests/acceptance/features/crawl.feature`
- [x] T013 [US1] Update process invocation and assertions to avoid all source artifact paths and check stdout, stderr, and status in `tests/acceptance/steps/crawl.steps.ts`; do not run the acceptance suite
- [ ] T014 [US1] Run `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run test:coverage`; pause for review without executing acceptance tests

**Checkpoint**: Acceptance tests describe the desired behavior and remain unexecuted as requested.

### Milestone B: Domain title policy and pipeline factory

- [X] T015 [P] [US1] Add pure title-word predicates for `gt` and `le` using the established word-count rule in `src/domain/policies/entry-filter.policy.ts`
- [X] T016 [P] [US1] Add table-driven policy tests for whitespace, punctuation-only tokens, internal punctuation, boundary counts, and empty titles in `tests/unit/domain/policies/entry-filter.policy.test.ts`
- [X] T017 [US1] Define factory configuration (`comments | points`, optional title-word rule) and async pipeline factory in `src/application/pipeline/factory/factory.ts`
- [X] T018 [US1] Add a configured title filter step in `src/application/pipeline/steps/filter-title-words.step.ts` using the domain policy
- [X] T019 [US1] Add table-driven tests for configured filter and sort pipeline composition, defaults supplied by caller, all four combinations, stable ties, missing metrics, and no matches in `tests/unit/application/pipeline/factory/factory.test.ts` and `tests/unit/application/pipeline/steps/filter-title-words.step.test.ts`
- [X] T020 [US1] Run `npm run test:unit -- tests/unit/domain/policies/entry-filter.policy.test.ts tests/unit/application/pipeline/factory/factory.test.ts` and the non-acceptance quality gates; pause for review before use-case changes

**Checkpoint**: Domain predicates and configured pipeline are independently tested and green.

### Milestone C: Crawler use case and composition wiring

- [ ] T021 [US1] Define user-level crawl filter/ranking request types and an injected pipeline factory contract independent of `PipelineConfig` in `src/application/ports/in/crawler.port.ts`
- [ ] T022 [US1] Update crawler use case to retrieve at most the first 30 entries, obtain a pipeline from its injected factory, and apply it to the retrieved stream in `src/application/usecases/crawler.usecase.ts`
- [ ] T023 [US1] Add table-driven use-case tests for result contents, candidate cutoff, source/factory call counts and exact arguments, filter/ranking combinations, and propagated failures in `tests/unit/application/usecases/crawler.usecase.test.ts`
- [ ] T024 [US1] Wire the concrete pipeline factory into the crawler use case in `src/presentation/main.ts`
- [ ] T025 [US1] Run `npm run test:unit -- tests/unit/application/usecases/crawler.usecase.test.ts` and the non-acceptance quality gates; pause for review before CLI changes

**Checkpoint**: Crawler processing is injected and tested without coupling the use case to pipeline folder configuration types.

### Milestone D: CLI arguments and error behavior

- [ ] T026 [US1] Add `--top-comments`, `--top-points`, and `--title-words <rule>` parsing with default values and conflict validation in `src/presentation/cli/crawl.ts`
- [ ] T027 [US1] Pass selected ranking and title-word configuration through the crawler inbound port while preserving beta-only URL behavior in `src/presentation/cli/crawl.ts`
- [ ] T028 [US1] Ensure invalid arguments and crawler failures exit non-zero, use the exact maximum-value message, and preserve the existing generic crawler error message in `src/presentation/cli/crawl.ts`
- [ ] T029 [US1] Add table-driven CLI unit tests for defaults, each option, option combinations, conflicting flags, malformed/boundary values, output shape, failures, and expected mock arguments in `tests/unit/presentation/cli/crawl.test.ts`
- [ ] T030 [US1] Remove superseded long/short composed pipeline stubs and old ranking steps/tests from `src/application/pipeline/composed/long-titles.pipeline.ts`, `src/application/pipeline/composed/short-titles.pipeline.ts`, `src/application/pipeline/steps/filter-more-than-five-words.step.ts`, `src/application/pipeline/steps/filter-up-to-five-words.step.ts`, `src/application/pipeline/steps/top-by-comments.step.ts`, `src/application/pipeline/steps/top-by-points.step.ts`, and matching `tests/unit/application/pipeline/` files after confirming no imports remain
- [ ] T031 [US1] Run `npm run test:unit` and the non-acceptance quality gates; pause for review before final acceptance verification

**Checkpoint**: User Story 1 behavior is implemented; acceptance suite remains unrun until approved final verification.

## Phase 4: User Story 2 - Trust CLI Acceptance Results (Priority: P2)

**Goal**: Ensure acceptance failures validate process status as well as expected error output, while treating the CLI as a standalone black box.

**Independent Test**: A failing CLI invocation has the expected stderr and non-zero status; a successful invocation has status zero. Acceptance tests use the runnable package/command, not source paths.

- [x] T032 [US2] Review every failure scenario and step to ensure both expected output and non-zero process status are asserted in `tests/acceptance/features/crawl.feature` and `tests/acceptance/steps/crawl.steps.ts`
- [x] T033 [US2] Remove source-artifact path references from acceptance execution configuration and use the installed runnable CLI contract in `tests/acceptance/steps/crawl.steps.ts` and `package.json`
- [x] T034 [US2] Confirm successful scenarios assert status zero and failing scenarios assert non-zero status in `tests/acceptance/features/crawl.feature`

**Checkpoint**: Acceptance suite is ready for final execution and remains unrun before user review.

## Phase 5: Architecture Documentation Follow-up

**Purpose**: Align project architecture guidance with the supported behavior after runtime implementation is complete.

- [ ] T035 Update `docs/ARCHITECTURE.md` domain rules to document all supported filter/ranking combinations and stable tie behavior
- [ ] T036 Update `.specify/memory/constitution.md` deterministic domain rules to match the completed implementation
- [ ] T037 Review whether removing obsolete pipeline code requires any further cleanup and record the final file set in `specs/003-filter-sort-stories/plan.md`

## Phase 6: Final Verification

**Purpose**: Execute the explicitly deferred acceptance suite only after the user approves this final milestone.

- [ ] T038 Run `HN_CRAWLER_ACCEPTANCE_URL="<configured deterministic URL>" npm run test:acceptance:local` and inspect process status, output, and failures; do this only after explicit user approval in the final milestone
- [ ] T039 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run test:coverage` after acceptance verification

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Review only; existing project setup is reused.
- **Foundational (Phase 2)**: Blocking shared async pipeline foundation for User Story 1.
- **User Story 1 (Phase 3)**: Depends on pipeline foundation; its milestones are sequential and each stops for review.
- **User Story 2 (Phase 4)**: Acceptance contract changes are drafted in US1 Milestone A, then audited independently after feature behavior is implemented.
- **Architecture Documentation (Phase 5)**: Depends on runtime behavior being implemented and reviewed.
- **Final Verification (Phase 6)**: Depends on reviewed implementation and the user's explicit approval to run acceptance tests.

### User Story Dependencies

- **US1 (P1)**: Depends on foundational pipeline operators; delivers filter/sort behavior.
- **US2 (P2)**: Acceptance test quality work overlaps US1's first milestone, but final audit depends on the standalone CLI behavior being available.

### Parallel Opportunities

- T002, T003, T004, and T005 touch separate type/operator/orchestrator files and can be implemented in parallel after review confirms their contracts.
- T015 and T016 can be developed concurrently with pipeline factory scaffolding because they touch separate domain/test files.
- T026 and T027 are in the same CLI file and should be handled together; their tests follow them.
- US1 and US2 acceptance documentation tasks share acceptance files and should be sequential to avoid edit conflicts.

## Implementation Strategy

### MVP First

1. Complete pipeline foundation and its unit tests.
2. Complete US1 domain/factory milestone and review.
3. Complete US1 crawler wiring milestone and review.
4. Complete US1 CLI milestone and review.
5. Audit US2 black-box process and status assertions.
6. Update architecture documentation after runtime behavior is complete.
7. Request approval at the final acceptance milestone, then execute acceptance and all final gates.

### Incremental Delivery

The implementation follows the milestone checkpoints in the plan. Each code milestone runs focused unit tests and required quality gates, then pauses for review. Acceptance tests are authored first but are not executed until the final milestone.

## Notes

- Every task uses the required checkbox, sequential ID, optional `[P]`, and story label for user-story tasks; descriptions identify exact file paths.
- `[P]` marks only work that can proceed in separate files without depending on incomplete implementation tasks.
- Unit test files follow the project table-driven style and `it should ...` phrasing.
- Do not run acceptance tests before T038.
- The acceptance URL must be supplied through the repository's existing `HN_CRAWLER_ACCEPTANCE_URL` configuration; use no local live-site access.
