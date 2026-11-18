# Tasks: Best-Effort Usage Tracking

**Input**: Design documents from `/specs/004-usage-tracking/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/usage-cli.md`

**Tests**: Required by the specification and project TDD rules. Acceptance scenarios are written first but MUST NOT be executed before the final, explicitly approved milestone. Unit tests are table-driven and use `it should when` wording with assertions for outcomes and relevant mock calls/arguments.

**Organization**: Tasks are grouped by user story and implementation dependencies. Each milestone is a review checkpoint; stop for user review before starting the next milestone.

## Phase 1: Setup

**Purpose**: Confirm existing CLI composition and available Node 26 UUIDv7 support; no project initialization or dependency additions are expected.

- [ ] T001 Verify the runtime supports native `crypto.randomUUIDv7()` and inspect the existing CLI builder, crawler port, and composition root in `src/presentation/main.ts` without adding dependencies

## Phase 2: Acceptance Contract (Write First, Do Not Run)

**Purpose**: Specify user-visible usage behavior as standalone CLI acceptance scenarios before implementation.

- [x] T002 [P] [US1] Add acceptance scenarios for a crawl usage record on default, ranking-only, title-only, and combined filter/ranking requests in `tests/acceptance/features/usage.feature`
- [x] T003 [P] [US1] Add acceptance scenarios for usage recording after crawl success/failure and for best-effort behavior preserving crawl results/errors in `tests/acceptance/features/usage.feature`
- [x] T004 [P] [US2] Add acceptance scenarios for empty usage output, serialized record fields/order, unsupported args, and process-local history behavior in `tests/acceptance/features/usage.feature`
- [x] T005 [US1] Add black-box process steps for usage command output and crawl usage scenarios in `tests/acceptance/steps/usage.steps.ts`, avoiding imports or references to source artifacts
- [x] T006 Run `npm run format:check`, `npm run lint`, and `npm run typecheck` only; do not execute acceptance tests; pause for review

**Checkpoint**: Acceptance contract is reviewable and remains unrun.

## Phase 3: Foundational Domain Model and Repository Port

**Purpose**: Define shared domain data and the output port needed by both user stories.

### Milestone A: Usage entity and applied-filters value object

- [x] T007 [P] Create `AppliedFilters` builder in `src/domain/vo/applied-filters.vo.ts`, exposing sort/title choices and deterministic sort-first serialization while hiding string tags
- [x] T008 [P] Add table-driven `it should when` tests for sort mappings, optional title mappings, combined tag order, and omitted title tag in `tests/unit/domain/vo/applied-filters.vo.test.ts`
- [x] T009 Create `Usage` entity in `src/domain/entities/usage.entity.ts` with UUIDv7 request ID, Unix-millisecond request timestamp, `AppliedFilters`, and validated non-negative integer duration
- [x] T010 Add table-driven `it should when` tests for valid fields, UUIDv7 shape, timestamp and duration rules in `tests/unit/domain/entities/usage.entity.test.ts`
- [x] T011 Define `UsageRepositoryPort` save and get-all operations in `src/application/ports/out/usage-repository.port.ts`
- [x] T012 Run `npm run quality`; formatting, lint, typecheck, and 100% unit coverage pass

**Checkpoint**: Domain record/filter types and repository contract are reviewed and green.

### Milestone B: In-memory repository

- [x] T013 [P] Implement `UsageRepositoryPort` using a process-local list in `src/infrastructure/persistence/in-memory/in-memory.repository.ts`; preserve insertion order and return a defensive list copy
- [x] T014 Add table-driven `it should when` tests for empty history, sequential saves, insertion order, and retrieval isolation in `tests/unit/infrastructure/persistence/in-memory/in-memory.repository.test.ts`
- [x] T015 Run `npm run quality`; all non-acceptance gates pass with 100% unit coverage

**Checkpoint**: Minimal process-local storage is reviewed and green.

## Phase 4: User Story 1 - Record Crawl Usage (Priority: P1)

**Goal**: Capture one best-effort usage record for each normalized crawl attempt, including successful and failed core execution.

**Independent Test**: Exercise the decorated crawler with fake clock/ID/repository dependencies and verify usage fields, effective filter mappings, exactly one save attempt, unchanged result/original failure, and swallowed repository failures.

### Milestone A: Applied filter mapper

- [x] T016 [P] [US1] Implement `mapAppliedFilters` from `CrawlRequest` to `AppliedFilters` in `src/application/mappers/applied-filters.mapper.ts`
- [x] T017 [P] [US1] Add table-driven `it should when` mapper tests for comments/points ranking, optional title rules, and default request values with exact expected labels in `tests/unit/application/mappers/applied-filters.mapper.test.ts`
- [x] T018 [US1] Run `npm run quality`; all non-acceptance gates pass with 100% unit coverage

**Checkpoint**: The application mapping is tested independently of the decorator and infrastructure.

### Milestone B: Tracking decorator

- [ ] T019 [US1] Implement `TrackedCrawlerUseCase` in `src/application/usecases/decorators/tracked-crawler.usecase.ts`; wrap the crawler port, capture request-start UTC milliseconds and monotonic start, map filters, and construct a UUIDv7 usage record for both resolve and reject paths
- [ ] T020 [US1] Isolate usage entity construction and repository-save errors so tracking cannot alter returned entries or replace the original crawler exception in `src/application/usecases/decorators/tracked-crawler.usecase.ts`
- [ ] T021 [US1] Add table-driven `it should when` decorator tests for success, crawler error, save error, exact record fields, IDs/timestamps/durations, and repository calls/arguments in `tests/unit/application/usecases/decorators/tracked-crawler.usecase.test.ts`
- [ ] T022 [US1] Run focused decorator tests and non-acceptance quality gates; pause for review

**Checkpoint**: Tracking is best effort and preserves core crawl behavior.

## Phase 5: User Story 2 - View Current Usage History (Priority: P1)

**Goal**: Let users invoke `hn-crawler usage` to view the current process's records as a JSON array.

**Independent Test**: Inject a fake repository into the usage command and verify empty/populated JSON output, insertion order, exact public fields, successful status, and non-zero handling for unsupported args/read errors.

### Milestone A: Usage command

- [ ] T023 [P] [US2] Implement `usage` subcommand in `src/presentation/cli/usage.ts`, accepting no feature-specific args/options and serializing repository records as the contract's JSON array
- [ ] T024 [P] [US2] Add table-driven `it should when` tests for empty history, populated records, exact JSON fields/order, repository read failure, and unsupported args in `tests/unit/presentation/cli/usage.test.ts`
- [ ] T025 [US2] Run focused usage CLI unit tests and non-acceptance quality gates; pause for review

**Checkpoint**: Usage output is independently reviewable against the CLI contract.

### Milestone B: Composition root integration

- [ ] T026 [US1] Wire one in-memory repository, core crawler, and tracking decorator in `src/presentation/main.ts`; inject the decorated crawler into `createCrawlCommand`
- [ ] T027 [US2] Register `createUsageCommand` with the same repository instance in `src/presentation/main.ts` and verify both commands share process-local storage
- [ ] T028 [US1] Update crawl command request normalization only as needed to pass effective sort/title choices to the decorator while preserving current crawl output, error text, and option semantics in `src/presentation/cli/crawl.ts`
- [ ] T029 Run all unit tests and non-acceptance quality gates; pause for review

**Checkpoint**: Both commands are wired to the same in-memory history; independent processes intentionally start empty.

## Phase 6: Final Acceptance and Quality Verification

**Purpose**: Run the previously deferred black-box suite only after the user explicitly approves the final milestone.

- [ ] T030 After explicit user approval, execute the acceptance tests for usage recording and retrieval using the configured deterministic environment and verify process-local lifetime behavior
- [ ] T031 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run test:coverage`; record results and pause for final review

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Confirms runtime and current wiring; no code dependencies.
- **Acceptance Contract (Phase 2)**: Written before implementation, never executed until Phase 6 approval.
- **Foundation (Phase 3)**: Domain model and repository port block the tracker, adapter, and usage CLI.
- **User Story 1 (Phase 4)**: Depends on Phase 3; produces usage records for every crawl attempt.
- **User Story 2 (Phase 5)**: Depends on the repository port/adapter. Its command can be implemented independently from the tracking decorator, then composition integration shares the adapter.
- **Final Verification (Phase 6)**: Depends on reviewed implementation and explicit user approval for acceptance execution.

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 3 and delivers recording with failure isolation.
- **US2 (P1)**: Depends on the usage repository contract and implementation; command logic can proceed once its read API is available. Composition integration with US1 shares repository state in the same process.

### Parallel Opportunities

- T002, T003, and T004 work in the acceptance feature file and must be combined or done sequentially if editing the same file; T005 is a separate step file but depends on scenario wording.
- T007/T008 and T009/T010 can proceed in parallel because the value object and entity occupy separate files; entity depends on the value-object contract.
- T013 and T014 share repository behavior and should be developed test-first and sequentially despite separate files.
- T016/T017 can be implemented in separate mapper/test files after domain types are available.
- T023/T024 can proceed independently from the tracking decorator once the repository port is stable.
- Composition wiring tasks T026–T028 share `main.ts`/CLI integration and should be completed in sequence.

## Implementation Strategy

### MVP First

1. Complete acceptance scenario authoring and review without running acceptance.
2. Complete and review the domain usage model and repository port.
3. Complete US1 tracking mapper/decorator with failure isolation and tests.
4. Complete US2 usage command with empty/populated output behavior.
5. Wire both commands to the shared process-local repository.
6. After review and explicit approval, execute acceptance and final quality gates.

### Incremental Delivery

Each named milestone is a review checkpoint. Stop after its focused tests and non-acceptance gates pass, report the changed files and verification results, and wait for the user's `continue` before beginning the next milestone. Acceptance execution is reserved for the final approved milestone.

## Notes

- Every task has a checkbox, sequential task ID, and concrete file paths; user-story tasks carry `[US1]` or `[US2]` labels.
- Unit test names use the project convention `it should when` and assert outcomes plus relevant mock arguments/calls.
- The `usage` history is intentionally process-local in this feature; a fresh CLI process starts with `[]`. Persistence is deferred to a future feature.
- Acceptance tests must treat the executable as a black box; do not import `src` modules or assert compiled source paths.
- Do not add SQLite, cache, file persistence, or dependencies.
