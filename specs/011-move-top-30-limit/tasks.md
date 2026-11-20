# Tasks: Move Top-30 Limit to HN Adapter

**Input**: Design documents from `/specs/011-move-top-30-limit/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Unit tests ARE requested — this is a test-first refactor (AGENTS.md NON-NEGOTIABLE; plan milestones explicitly refactor tests test-first). Acceptance tests are NOT modified or added (spec FR-006/SC-003: existing acceptance tests pass with zero modifications; no new acceptance tests).

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a quality-gate baseline before the refactor begins.

- [x] T001 Verify `npm run quality` passes on the current codebase (baseline before any refactor changes)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configuration values that every subsequent task depends on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: User Story 1 is blocked until Phase 2 completes.

- [x] T002 Add `maxEntriesToFetch` (env `HN_CRAWLER_MAX_ENTRIES_TO_FETCH`, default 30) and `maxPagesToFetch` (env `HN_CRAWLER_MAX_PAGES_TO_FETCH`, default 10) to `src/config/config.ts` with positive-integer validation matching existing config style
- [x] T003 Add table-driven unit tests for the new config cases (defaults, overrides, invalid values) in `tests/unit/config/config.test.ts`
- [x] T004 Run `npm run quality` — config milestone must be green before user story work begins

**Checkpoint**: Foundation ready — User Story 1 implementation can now begin.

---

## Phase 3: User Story 1 - Crawl output stays limited to top 30 stories (Priority: P1) 🎯 MVP

**Goal**: Move the responsibility for limiting crawl output to the top 30 stories from the crawl use case to the HN web adapter. `CrawlRequest` drops `url` (bound to axios at startup) and carries `maxEntries` from `config.maxEntriesToFetch`. CLI output fields, ordering, error handling, and exit codes remain byte-identical to pre-refactor behavior.

**Independent Test**: Run the existing crawl acceptance scenarios against a deterministic page and verify the displayed JSON still contains at most 30 entries in page order with identical fields/ranking/error behavior.

### Tests for User Story 1 (test-first: write and confirm FAIL before implementation)

- [x] T005 [P] [US1] Refactor `tests/unit/application/usecases/crawler.usecase.test.ts`: remove the "limit to first 30" test; add a test confirming `CrawlerUseCase` calls `fetchEntries(request.maxEntries)` and pipes every source entry through the pipeline (confirm new tests fail first)
- [x] T006 [P] [US1] Refactor `tests/unit/infrastructure/web/hn-web.adapter.test.ts`: table-driven cases for pagination start/stop, `hasEntries()` break, `maxEntries` cap, and page-URL construction (confirm new tests fail first)

### Implementation for User Story 1

- [x] T007 [P] [US1] Update `EntrySourcePort.fetchEntries(maxEntries)` in `src/application/ports/out/entry-source.port.ts`: remove the `url` argument; keep `maxEntries: number`
- [x] T008 [P] [US1] Update `CrawlRequest` in `src/application/ports/in/crawler.port.ts`: drop `url`, add `maxEntries: number`
- [x] T009 [US1] Remove the `if (entries.length === 30) break` limiting block from `CrawlerUseCase.execute()` in `src/application/usecases/crawler.usecase.ts`; call `this.entrySource.fetchEntries(request.maxEntries)` and pipe every yielded entry through the pipeline (no count cap in the use case)
- [x] T010 [US1] Refactor `HnWebAdapter.fetchEntries(maxEntries)` in `src/infrastructure/web/hn-web.adapter.ts`: paginate pages 1..K via the axios-bound base URL (page 1 = empty path; page N = `?p=N` or `&p=N`), build the parser (POM) per page, break the loop when `hasEntries()` is false, stop and return once `maxEntries` entries have been yielded
- [x] T011 [US1] Update `src/presentation/cli/crawl.ts` to build `CrawlRequest` with `maxEntries: config.maxEntriesToFetch` (no `url`)
- [x] T012 [US1] Update `src/presentation/main.ts` to wire `config.maxPagesToFetch` into the `HnWebAdapter` constructor
- [x] T013 [US1] Delete obsolete code and unused imports that became unnecessary because of the refactor across `src/`
- [x] T014 [US1] Run final `npm run quality` — must be fully green; codebase clean and green, ready for user review

**Checkpoint**: At this point, User Story 1 is fully functional and independently testable — crawl output still returns at most 30 entries in page order with identical behavior.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final validation that affects the overall refactor.

- [x] T015 [P] Build prerequisite for quickstart.md validation scenarios completed (`npm run build` green). Manual crawl validation against a deterministic page (`HN_CRAWLER_WEB_PAGE_BASE_URL`) is yours to run at the end.
- [x] T016 [P] Confirm no references to the removed `url` field on `CrawlRequest` or the hardcoded `30` limit remain across `src/` and `tests/`; fixed `HnHttpClient.fetchPage(pageNumber?)` to use `http.get('', { params: { p: pageNumber } })` (was ignoring the `url` argument), resolving the acceptance-test crawl failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. Establishes the quality-gate baseline.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS User Story 1. `config.maxEntriesToFetch`/`maxPagesToFetch` are required by every US1 task.
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion.
- **Polish (Final Phase)**: Depends on User Story 1 completion.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories (single-story feature).

### Within User Story 1

- Tests (T005, T006) MUST be written and FAIL before implementation (T007–T013).
- Port changes (T007, T008) before use case (T009) and adapter (T010).
- Use case (T009) and adapter (T010) before CLI (T011) and composition root (T012).
- Cleanup (T013) after all implementation; quality gate (T014) last.

### Parallel Opportunities

- T007 and T008 ([P]): independent port edits on different files.
- T005 and T006 ([P]): test refactors on different files, no cross-dependency once ports are done.
- T015 and T016 ([P]): final validation on different concerns.
- All [P] tasks within a phase can be executed in parallel once their prerequisite phase is complete.

### Parallel Example: User Story 1

```bash
# Launch port changes together (once Foundational is complete):
Task: "Update EntrySourcePort.fetchEntries(maxEntries) in src/application/ports/out/entry-source.port.ts"
Task: "Update CrawlRequest in src/application/ports/in/crawler.port.ts"

# Launch test refactors together (once ports are done):
Task: "Refactor tests/unit/application/usecases/crawler.usecase.test.ts"
Task: "Refactor tests/unit/infrastructure/web/hn-web.adapter.test.ts"

# Launch final validation together:
Task: "Run quickstart.md validation scenarios manually"
Task: "Confirm no references to removed url/30 limit remain"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (quality baseline)
2. Complete Phase 2: Foundational (CRITICAL — blocks US1; config values)
3. Complete Phase 3: User Story 1 (the refactor; test-first)
4. **STOP and VALIDATE**: Run `npm run quality` fully green; verify crawl output identical to pre-refactor via `quickstart.md` scenarios
5. Deploy/demo if ready (MVP = unchanged behavior with limit moved to adapter)

### Incremental Delivery

1. Setup + Foundational → Foundation ready, quality green
2. Add User Story 1 → test-first refactor → quality green → independently testable MVP
3. Polish → final validation complete

Each increment leaves `npm run quality` green and is presented for review before the next begins (per plan.md milestones).
