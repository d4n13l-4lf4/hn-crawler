# Tasks: Web Crawler Page Object Model

**Input**: Design documents from `/specs/009-crawler-page-object-model/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit tests ARE included — TDD is non-negotiable per the constitution. Acceptance tests are NOT included (spec explicitly states none will be implemented or run for this feature).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each milestone leaves `npm run quality` green and is presented for review before the next begins.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a green baseline before any refactoring begins.

- [x] T001 Establish baseline quality gate: run `npm run quality` (defined in package.json) to confirm the codebase starts in a green state before the refactor

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm the prerequisites that every user story depends on are satisfied.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Confirm cheerio dependency is available and no new packages are needed (package.json already includes cheerio 1.0.0)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Preserve Existing Crawl Behavior (Priority: P1) 🎯 MVP

**Goal**: The POM class produces byte-identical crawl output (rank, title, points, comments) for up to 30 entries, preserving title-word filtering, ranking by comments/points, and the `none` applied-filter semantics exactly as before the refactor.

**Independent Test**: `npm run test:unit` for `tests/unit/infrastructure/web/hn-crawler.parser.test.ts` — all tests pass and per-file/aggregate coverage remains 100%.

### Tests for User Story 1 (TDD — write FIRST, confirm they FAIL before implementation)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [US1] Write table-driven parser unit tests first in tests/unit/infrastructure/web/hn-crawler.parser.test.ts covering: `hasEntries()` true/false, async iteration yielding entries, empty page termination, missing metadata defaults to zero, and all-sample-entries source order (verify they FAIL before implementation)

### Implementation for User Story 1

- [x] T004 [US1] Convert src/infrastructure/web/hn-crawler.parser.ts to POM class HnCrawlerParser: constructor receives raw HTML, initializes cheerio into a private property
- [x] T005 [US1] Implement private methods in src/infrastructure/web/hn-crawler.parser.ts to extract rank, title, points, and comments from each story row (same selectors/logic as before)
- [x] T006 [US1] Implement hasEntries(): boolean on HnCrawlerParser in src/infrastructure/web/hn-crawler.parser.ts
- [x] T007 [US1] Implement async-iterable entry extraction on HnCrawlerParser in src/infrastructure/web/hn-crawler.parser.ts: terminates the iterator when no entries exist, otherwise yields entries one by one
- [x] T008 [US1] Run parser unit tests in tests/unit/infrastructure/web/hn-crawler.parser.test.ts — confirm they pass and coverage remains 100%

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently; `npm run quality` must be green before review

---

## Phase 4: User Story 2 - Extract Entries Through a Page Object (Priority: P2)

**Goal**: hn-web.adapter.ts uses the POM; the POM's single responsibility is getting the entries from the web page as they are in the page; it exposes `hasEntries()` and async iteration; private methods handle title/comments/points/rank extraction.

**Independent Test**: `npm run test:unit` for `tests/unit/infrastructure/web/hn-web.adapter.test.ts` — all tests pass and per-file/aggregate coverage remains 100%.

### Tests for User Story 2 (TDD — write FIRST, confirm they FAIL before implementation)

- [x] T009 [US2] Write adapter unit tests first in tests/unit/infrastructure/web/hn-web.adapter.test.ts covering: adapter instantiates HnCrawlerParser with fetched HTML, delegates entry iteration to it, and fetchEntries(url) signature/behavior unchanged (verify they FAIL before implementation)

### Implementation for User Story 2

- [x] T010 [US2] Update src/infrastructure/web/hn-web.adapter.ts to instantiate HnCrawlerParser with the fetched HTML and delegate entry iteration to it (replacing the parseHnEntries import/call); EntrySourcePort interface and fetchEntries(url) signature unchanged
- [x] T011 [US2] Run adapter unit tests in tests/unit/infrastructure/web/hn-web.adapter.test.ts — confirm they pass and coverage remains 100%

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently; `npm run quality` must be green before review

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Remove obsolete code and confirm the final green state.

- [x] T012 [P] Remove the obsolete parseHnEntries standalone function and any now-unused imports from src/infrastructure/web/hn-crawler.parser.ts
- [x] T013 [P] Confirm no references to parseHnEntries remain across src/ and tests/
- [x] T014 Run final `npm run quality` gate (defined in package.json: format, format:check, lint, typecheck, test:coverage) — must be fully green
- [x] T015 Delete any unused files rendered obsolete by the refactor across src/ and tests/ (none expected; verify none exist)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (T001)
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories (T002)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) must complete before User Story 2 (P2), because the adapter depends on the POM class
  - User Story 2 depends on User Story 1 completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories; this is the MVP
- **User Story 2 (P2)**: Depends on User Story 1 (P1) — the adapter consumes the POM class built in US1; independently testable via its own adapter unit tests

### Within Each User Story

- Tests (T003, T009) MUST be written and FAIL before implementation
- Class structure (T004) before private extractors (T005) before hasEntries (T006) before async iteration (T007)
- Core parser implementation (T004–T007) before adapter integration (T010)
- Story complete before moving to the next priority
- Commit after each task or logical group

### Parallel Opportunities

- T002 [P] (foundational check) is independent
- No two implementation tasks editing the same file are parallelizable (T004–T007 all edit hn-crawler.parser.ts; T010 edits hn-web.adapter.ts)
- Test-writing tasks (T003, T009) are story-entry points and not marked [P] so each milestone is reviewed as a unit

---

## Parallel Example

No genuinely parallel implementation tasks exist within a single story because the POM class and adapter each live in one file edited sequentially. The only [P] task is T002 (foundational dependency check), which runs independently of everything else.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 — baseline quality gate green)
2. Complete Phase 2: Foundational (T002 — confirm cheerio available)
3. Complete Phase 3: User Story 1 (T003–T008 — POM class + parser unit tests, quality gate green)
4. **STOP and VALIDATE**: Test User Story 1 independently; present milestone for review
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Quality gate green → Review (MVP)
3. Add User Story 2 → Test independently → Quality gate green → Review
4. Complete Polish (T012–T015) → Final quality gate green → Review
5. Each story adds value without breaking previous stories; all source behavior remains byte-identical

### Incremental Milestones (per plan.md)

- **Milestone 1** (US1): POM class in hn-crawler.parser.ts + unit tests → review when `npm run quality` is green
- **Milestone 2** (US2): Adapter uses POM + adapter unit tests → review when `npm run quality` is green
- **Milestone 3** (Polish): Remove obsolete parseHnEntries code + final quality gate green → review

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- No acceptance tests are implemented or run for this feature (per spec); validation is via unit tests + `npm run quality` + optional user-run acceptance
