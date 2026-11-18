---
description: 'Task list for Crawl Top Stories refinements'
---

# Tasks: Crawl Top Stories Refinements

**Input**: Design documents from `specs/002-crawl-top-stories/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/cli.md`, `quickstart.md`

**Tests**: Unit tests are required before implementation under the project TDD guidance. Acceptance test execution is explicitly deferred and must not be run locally for this feature.

**Organization**: Tasks are grouped by user story and ordered to preserve the user's six incremental review milestones. Finish each milestone, report its changes and validation, and pause for user confirmation before beginning the next.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The project and dependencies already exist. No setup changes are needed.

- [x] T001 Confirm existing `tests/resources/hacker-news.html` remains the parser reference; do not duplicate or alter the fixture

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reconcile previous acceptance-test tasks and make the acceptance execution boundary explicit before implementation.

- [x] T002 Update `specs/002-crawl-top-stories/plan.md` and `specs/002-crawl-top-stories/quickstart.md` to state the repository URL environment variable contract, local command, CI mapping, and no-local-acceptance rule
- [x] T003 Keep acceptance harness review and acceptance execution as separate unchecked tasks in `specs/002-crawl-top-stories/tasks.md`; do not run any acceptance command

**Checkpoint**: Confirm the task plan and quickstart consistently defer acceptance execution. Then pause for user review before Milestone 1.

## Phase 3: User Story 1 — Crawl Top Stories (Priority: P1) 🎯 MVP

**Goal**: Preserve the core crawl behavior while moving URL configuration and domain normalization to their intended layers and retaining HTTP failure causes.

**Independent Test**: Unit tests verify configured URL forwarding, URL override behavior, HTTP cause chaining, `Title` and `Numeric` defaults/parsing, HNEntry values, parser extraction from `tests/resources/hacker-news.html`, and primitive JSON serialization. Run non-acceptance build/quality gates only; acceptance tests remain deferred.

### Milestone 2 — Configured default URL injection

**Tests first**

- [x] T004 [US1] Update `tests/unit/application/usecases/crawler.usecase.test.ts` to assert the supplied URL reaches the entry-source mock, including default-config and override cases, with expected calls and arguments

**Implementation**

- [x] T005 [US1] Add `src/config/config.ts` exporting `newsCombinatorUrl` with value `https://news.ycombinator.com/`
- [x] T006 [US1] Update `src/application/usecases/crawler.usecase.ts` and `src/application/ports/in/crawler.port.ts` so the use case has no hardcoded URL default and receives its URL from its caller
- [x] T007 [US1] Update `src/presentation/main.ts` and `src/presentation/cli/crawl.ts` to pass the configured default URL while allowing beta `--url` to override it
- [x] T008 [US1] Run focused use-case/CLI unit tests and non-acceptance quality gates for the configured URL flow

**Checkpoint**: Review URL ownership/injection and passing focused checks; stop for user confirmation before Milestone 3.

### Milestone 3 — HTTP network error cause chaining

**Tests first**

- [x] T009 [US1] Update `tests/unit/infrastructure/web/hn-http.client.test.ts` with table-driven fetch-error cases asserting outcome, requested URL mock arguments, contextual message, and `cause` identity

**Implementation**

- [x] T010 [US1] Update `src/infrastructure/web/hn-http.client.ts` to catch fetch failures and throw a contextual `Error` with `{ cause: error }`, preserving HTTP status handling
- [x] T011 [US1] Run focused HTTP client unit tests and non-acceptance quality gates

**Checkpoint**: Review HTTP failure context/cause and green focused checks; stop for user confirmation before Milestone 4.

### Milestone 4 — Import alias consistency

- [x] T012 [US1] Convert eligible feature-internal relative imports in `src/` and `tests/unit/` to the existing `@/*` alias without changing runtime behavior
- [x] T013 [US1] Run build, formatter, lint, typecheck, and unit coverage to verify alias resolution

**Checkpoint**: Review import-only changes and non-acceptance checks; stop for user confirmation before Milestone 5.

### Milestone 5 — HNEntry value objects and parser extraction

**Tests first**

- [x] T014 [P] [US1] Add table-driven tests in `tests/unit/domain/vo/title.test.ts` for raw title values and empty/invalid inputs defaulting to `''`
- [x] T015 [P] [US1] Add table-driven tests in `tests/unit/domain/vo/numeric.test.ts` for digit parsing, no match, invalid input, and NaN defaulting to `0`
- [x] T016 [US1] Update `tests/unit/domain/entities/hn-entry.entity.test.ts` to assert `Title` and `Numeric` value object fields/accessors and primitive values
- [x] T017 [US1] Update `tests/unit/infrastructure/web/hn-crawler.parser.test.ts` to assert best-effort source extraction, first fixture entry values, row order, and zero/empty defaults through value objects
- [x] T018 [US1] Update `tests/unit/presentation/cli/crawl.test.ts` to assert serialized JSON contains primitive `rank`, `title`, `points`, and `number_of_comments` values only

**Implementation**

- [x] T019 [US1] Add dependency-free `src/domain/vo/title.ts` accepting raw string input and defaulting to `''`
- [x] T020 [US1] Add dependency-free `src/domain/vo/numeric.ts` accepting raw number/text input, using a precompiled `/\d+/` matcher where needed, and defaulting unmatched/invalid/NaN input to `0`
- [x] T021 [US1] Update `src/domain/entities/hn-entry.entity.ts` to use `Title` and `Numeric` for title, rank, points, and number of comments while preserving stable primitive accessors for presentation serialization
- [x] T022 [US1] Refactor `src/infrastructure/web/hn-crawler.parser.ts` to capture title/score/comment text best-effort, keep separate score and comment matchers, pass captured values to the value objects, and remove `normalizeText`/`parseInteger`
- [x] T023 [US1] Run focused VO/entity/parser/CLI unit tests, build, and all non-acceptance quality gates

**Checkpoint**: Review VO domain behavior, parser responsibility, output serialization, and green non-acceptance gates; stop for user confirmation before Milestone 6.

## Phase 4: User Story 2 — Crawl a Specified Page in Beta (Priority: P2)

**Goal**: Feed deterministic acceptance runs from a manually configured repository environment variable and ensure the published-beta acceptance workflow receives it.

**Independent Test**: Review that the acceptance step passes `HN_CRAWLER_ACCEPTANCE_URL` as `--url`, fails clearly when unset, and runs with `HN_CRAWLER_BETA=true`; inspect workflow configuration and do not execute acceptance tests locally.

### Milestone 1 — Acceptance URL environment and CI flow

- [x] T024 [US2] Update `tests/acceptance/steps/crawl.steps.ts` to read `HN_CRAWLER_ACCEPTANCE_URL`, fail with a clear setup error if empty, pass the URL to `--url`, and avoid starting a loopback server or falling back to live Hacker News
- [x] T025 [US2] Update `.github/workflows/acceptance-tests.yml` to map `${{ vars.HN_CRAWLER_ACCEPTANCE_URL }}` into the acceptance process and set `HN_CRAWLER_BETA: 'true'`
- [x] T026 [US2] Add a CI preflight in `.github/workflows/acceptance-tests.yml` that fails clearly if the mapped URL is missing before `npm run test:acceptance`
- [x] T027 Update `specs/002-crawl-top-stories/research.md`, `specs/002-crawl-top-stories/contracts/cli.md`, and `specs/002-crawl-top-stories/quickstart.md` with the repository variable contract and local command `HN_CRAWLER_ACCEPTANCE_URL='<fixture URL>' HN_CRAWLER_BETA=true npm run test:acceptance:local`; state that the command must not be run during this feature
- [x] T028 Review `.github/workflows/beta-release.yml` and `.github/workflows/acceptance-tests.yml` to confirm the post-publication workflow runs in the same repository context and receives repository Actions variables through explicit `vars` mapping; do not commit a variable value

**Checkpoint**: Review acceptance environment handling and CI/CD mapping. Do not run the acceptance suite locally; pause for user confirmation before Milestone 6.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Keep acceptance tasks pending and ensure the remaining checks comply with the user's requested workflow.

- [ ] T029 [US2] Await user review/comments on `tests/acceptance/features/crawl.feature` and `tests/acceptance/steps/crawl.steps.ts`; finalize only if requested
- [x] T030 [US1] Run final build and non-acceptance quality gates after all approved implementation milestones; do not invoke Cucumber or either acceptance npm script
- [x] T031 [US2] Record acceptance test execution as deferred for this feature in `specs/002-crawl-top-stories/tasks.md`; do not run the suite locally
- [x] T032 Confirm `specs/002-crawl-top-stories/plan.md`, `specs/002-crawl-top-stories/quickstart.md`, and `specs/002-crawl-top-stories/tasks.md` consistently record completed/deferred work

**Final Checkpoint**: Report the acceptance tasks still open. Acceptance tests are not run locally for this feature.

## Dependencies & Execution Order

### Phase Dependencies

- Setup is already complete; T001 records the existing fixture reference.
- Foundational reconciliation (T002–T003) precedes implementation work.
- The user's review checkpoints dictate execution order: acceptance URL/CI wiring (US2) was completed first, followed by config injection, HTTP cause chaining, import aliasing, and value objects (US1). Pause after each checkpoint for user confirmation.
- Final polish depends on the approved implementation milestones. Acceptance execution is excluded until separately authorized.

### User Story Dependencies

- **US1 (P1)**: Core crawl behavior and refinements; configured URL precedes HTTP, import alias, and VO/parser changes.
- **US2 (P2)**: Beta URL selection and deterministic acceptance wiring; the beta option exists already, and this milestone configures its acceptance input. No acceptance execution is required for implementation.

### Within Each Milestone

- Follow TDD for unit-tested behavior: update/write tests first, then implement, then run focused unit checks.
- User review is required after each numbered milestone; do not proceed until confirmation.
- Do not run acceptance tests locally, regardless of milestone.
- Keep the dependency rule: only the composition root constructs adapters/configuration; domain VOs remain dependency-free.

### Parallel Opportunities

- T014 and T015 can be implemented in parallel because they create different value object test files.
- Remaining tasks are sequential within milestones or modify shared files; do not parallelize them.

## Parallel Example: User Story 1

```text
Task: T014 — tests/unit/domain/vo/title.test.ts
Task: T015 — tests/unit/domain/vo/numeric.test.ts
```

## Implementation Strategy

### MVP First

US1 is the MVP because it preserves the user's primary crawl flow and implements config injection, error chaining, alias consistency, and domain value objects. Complete each US1 milestone in order, pausing for review each time. The prior implementation of US1 is already present; these tasks refine it.

### Incremental Delivery

1. Complete beta acceptance URL and CI variable wiring; pause for review without executing acceptance.
2. Complete configured default URL injection; pause for review.
3. Complete HTTP error cause chaining; pause for review.
4. Apply the import alias; pause for review.
5. Implement value objects, parser boundary, and serialization; pause for review.
6. Run non-acceptance validation, record acceptance execution as deferred, and await any user comments on the acceptance harness.

## Notes

- Every task has a checkbox, sequential ID, applicable story label, and concrete file path.
- `[P]` is reserved for independent edits in separate files.
- Table-driven tests should follow the project style using `should` wording and assert both outcomes and relevant mock calls/arguments.
- Acceptance-related implementation/configuration can be reviewed without running acceptance tests.
