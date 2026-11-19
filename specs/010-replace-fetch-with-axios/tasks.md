# Tasks: Resilient HTTP Client with Timeout and Retry

**Input**: Design documents from `/specs/010-replace-fetch-with-axios/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Unit tests ARE included — TDD is non-negotiable per the constitution. Acceptance tests are refactored in Milestone 0 (per user instruction to start with acceptance tests) but NOT run by the agent; the user runs them manually at the end of the whole implementation.

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

- [x] T002 [P] Confirm axios and cheerio dependencies are available (axios ^1.21.1 already installed per package.json and node_modules)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Preserve Crawl Behavior with Resilient HTTP Requests (Priority: P1) 🎯 MVP

**Goal**: The axios-based HTTP client produces byte-identical crawl output (rank, title, points, comments) for up to 30 entries, preserving title-word filtering, ranking by comments/points, and the `none` applied-filter semantics exactly as before the change. The base URL is bound to the axios instance via config (`HN_CRAWLER_WEB_PAGE_BASE_URL` env var or default).

**Independent Test**: `npm run test:unit` for `tests/unit/infrastructure/web/axios.test.ts`, `tests/unit/infrastructure/web/hn-http.client.test.ts`, and `tests/unit/infrastructure/web/hn-web.adapter.test.ts` — all tests pass and per-file/aggregate coverage remains 100%.

### Tests for User Story 1 (Milestone 0: Acceptance test refactor — done first, NOT run by agent)

> **NOTE: These acceptance tests are refactored first per user instruction, but NOT run by the agent. The user runs them manually at the end of the whole implementation.**

- [x] T003 [US1] Refactor tests/acceptance/features/crawl.feature: remove "in beta mode" phrasing and `--url` from all scenario step text; remove the three scenarios whose sole purpose was verifying `--url` ("Beta URL option selects the configured page", "Production help does not expose the URL option", "Production rejects the beta-only URL option"); reframe the invalid-URL scenario to not rely on `--url`
- [x] T004 [US1] Refactor tests/acceptance/features/usage.feature: remove "in beta mode" phrasing and `--url` from scenario step text
- [x] T005 [US1] Refactor tests/acceptance/steps/crawl.steps.ts: rename `getAcceptanceUrl()` to read `HN_CRAWLER_WEB_PAGE_BASE_URL`; remove `--url` from all `runCli` calls; remove the "production mode" step (`HN_CRAWLER_BETA: ''`); remove beta-mode phrasing from step definitions
- [x] T006 [US1] Refactor tests/acceptance/steps/usage.steps.ts: rename `getAcceptanceUrl()` to read `HN_CRAWLER_WEB_PAGE_BASE_URL`; remove `--url` from `runCli` calls; remove `HN_CRAWLER_BETA: 'true'` from `runCli` env; remove beta-mode phrasing from step definitions

### Tests for User Story 1 (TDD — write FIRST, confirm they FAIL before implementation)

- [x] T007 [US1] Write table-driven unit tests first in tests/unit/infrastructure/web/axios.test.ts covering: builder creates axios instance bound to baseURL, timeout applies, server errors (5xx) trigger retries up to maxRetries with retryDelay between attempts, non-server errors (4xx) are not retried (verify they FAIL before implementation)
- [x] T008 [US1] Write table-driven unit tests first in tests/unit/infrastructure/web/hn-http.client.test.ts covering: `fetchPage(url)` returns text body for successful request, status errors throw with `HTTP ${status}: ${statusText}`, network errors wrap with cause, constructor receives axios instance as private property (verify they FAIL before implementation)
- [x] T009 [US1] Write unit tests first in tests/unit/infrastructure/web/hn-web.adapter.test.ts covering: adapter instantiates HnHttpClient internally, delegates entry iteration to it, `fetchEntries()` takes no URL argument (verify they FAIL before implementation)

### Implementation for User Story 1 (Milestones 1–4)

- [x] T010 [US1] Add `httpTimeout` (15000ms), `httpMaxRetries` (3), `httpRetryDelay` (3000ms) to src/config/config.ts; `newsCombinatorUrl` resolves to `HN_CRAWLER_WEB_PAGE_BASE_URL` env var or default `https://news.ycombinator.com/`
- [x] T011 [US1] Create src/infrastructure/web/axios.ts with builder function `createAxiosHttpClient({ baseURL, timeout, maxRetries, retryDelay })` that configures and returns an axios instance bound to `baseURL` with timeout and server-error-only retry interceptor
- [x] T012 [US1] Convert src/infrastructure/web/hn-http.client.ts from `fetchPage(url)` standalone function to `HnHttpClient` class: constructor receives configured axios instance as constructor argument (private property); exposes `fetchPage(url: string): Promise<string>` with same signature/behavior as before (status error → throw, network error → wrap with cause, return text)
- [x] T013 [US1] Update src/infrastructure/web/hn-web.adapter.ts to construct/use `HnHttpClient` instead of the `{ fetch }` object; adapter no longer handles page URL (URL bound to axios instance at composition root); `fetchEntries()` takes no URL argument
- [x] T014 [US1] Remove `HN_CRAWLER_BETA` feature flag and `--url` option from src/presentation/cli/crawl.ts
- [x] T015 [US1] Update src/presentation/main.ts to build axios instance via builder with `baseURL` from `config.newsCombinatorUrl`, create `HnHttpClient`, and inject it into `HnWebAdapter`
- [x] T016 [US1] Run `npm run quality` (defined in package.json) — confirm all tests pass and coverage remains 100%

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently; `npm run quality` must be green before review

---

## Phase 4: User Story 2 - Configure HTTP Timeout and Server-Error Retries (Priority: P2)

**Goal**: HTTP requests to the Hacker News page apply a configurable timeout and automatically retry only on server errors up to a configurable number of times with a configurable pause between attempts; non-server errors are not retried.

**Independent Test**: `npm run test:unit` for `tests/unit/infrastructure/web/axios.test.ts` — timeout, server-error retry, and client-error no-retry tests all pass; per-file/aggregate coverage remains 100%.

### Tests for User Story 2 (TDD — write FIRST, confirm they FAIL before implementation)

- [x] T017 [P] [US2] Add table-driven test cases in tests/unit/infrastructure/web/axios.test.ts covering: timeout aborts request beyond configured limit, server error (5xx) retries up to maxRetries with retryDelay pause, non-server error (4xx) is not retried (verify they FAIL before implementation)

### Implementation for User Story 2

- [x] T018 [US2] Verify server-error retry interceptor in src/infrastructure/web/axios.ts retries only 5xx responses up to maxRetries with retryDelay between attempts
- [x] T019 [US2] Verify timeout configuration in src/infrastructure/web/axios.ts aborts requests exceeding timeout
- [x] T020 [US2] Verify non-server errors (4xx) are not retried in src/infrastructure/web/axios.ts
- [x] T021 [US2] Run `npm run quality` (defined in package.json) — confirm all tests pass and coverage remains 100%

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently; `npm run quality` must be green before review

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Remove obsolete code and confirm the final green state.

- [x] T022 [P] Remove the obsolete standalone `fetchPage` function and any now-unused imports from src/infrastructure/web/hn-http.client.ts
- [x] T023 [P] Confirm no references to `HN_CRAWLER_ACCEPTANCE_URL`, `HN_CRAWLER_BETA`, or `--url` remain across src/ and tests/
- [x] T024 [P] Delete any unused files rendered obsolete by the refactor across src/ and tests/ (none expected; verify none exist)
- [x] T025 Run final `npm run quality` gate (defined in package.json: format, format:check, lint, typecheck, test:coverage) — must be fully green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (T001)
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories (T002)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) is the MVP and must complete before User Story 2 (P2), because US2 builds on the axios client and HnHttpClient created in US1
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories; this is the MVP. Includes Milestone 0 (acceptance test refactor) done first.
- **User Story 2 (P2)**: Depends on User Story 1 (P1) — the resilience behavior is built on the axios client and HnHttpClient created in US1; independently testable via its own axios unit tests

### Within Each User Story

- Tests (T003–T009 for US1, T017 for US2) MUST be written and FAIL before implementation
- Config (T010) before axios builder (T011) before HnHttpClient (T012) before adapter (T013) before CLI/config removal (T014) before composition root (T015)
- Story complete before moving to the next priority
- Commit after each task or logical group

### Parallel Opportunities

- T002 [P] (foundational dependency check) is independent
- T003–T006 [US1] (acceptance test refactor across 4 different files) can run in parallel — different files, no dependencies on incomplete tasks
- T007–T009 [US1] (test writing for 3 different test files) can run in parallel — different files, no dependencies on incomplete tasks
- T017 [P] [US2] (adding test cases to existing axios.test.ts) — single file, sequential with T007
- T022–T024 [P] (polish across different files/checks) can run in parallel

---

## Parallel Example

```bash
# Launch acceptance test refactor tasks together (different files):
Task: "Refactor tests/acceptance/features/crawl.feature: remove beta mode and --url" (T003)
Task: "Refactor tests/acceptance/features/usage.feature: remove beta mode and --url" (T004)
Task: "Refactor tests/acceptance/steps/crawl.steps.ts: remove --url and beta mode" (T005)
Task: "Refactor tests/acceptance/steps/usage.steps.ts: remove --url and beta mode" (T006)

# Launch test-writing tasks together (different files):
Task: "Write axios.test.ts unit tests first" (T007)
Task: "Write hn-http.client.test.ts unit tests first" (T008)
Task: "Write hn-web.adapter.test.ts unit tests first" (T009)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 — baseline quality gate green)
2. Complete Phase 2: Foundational (T002 — confirm axios/cheerio available)
3. Complete Milestone 0 within US1: Acceptance test refactor (T003–T006 — refactored but not run by agent)
4. Complete Phase 3: User Story 1 (T007–T016 — axios builder, HnHttpClient, adapter, CLI, composition root, quality gate green)
5. **STOP and VALIDATE**: Test User Story 1 independently; present milestone for review
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Quality gate green → Review (MVP)
3. Add User Story 2 → Test independently → Quality gate green → Review
4. Complete Polish (T022–T025) → Final quality gate green → Review
5. Each story adds value without breaking previous stories; all source behavior remains byte-identical

### Incremental Milestones (per plan.md)

- **Milestone 0** (Acceptance test refactor): Remove `--url`/beta mode from acceptance features/steps; rename env var → review when typecheck-clean
- **Milestone 1** (Config + axios builder): Config settings + axios.ts builder + unit tests → review when `npm run quality` is green
- **Milestone 2** (HnHttpClient class): hn-http.client.ts refactor + unit tests → review when `npm run quality` is green
- **Milestone 3** (Adapter update): hn-web.adapter.ts uses HnHttpClient + CLI changes + unit tests → review when `npm run quality` is green
- **Milestone 4** (Composition root): main.ts wiring + remove obsolete fetchPage + final quality gate green → review

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- No acceptance tests are run by the agent for this feature (per spec); acceptance tests are refactored in Milestone 0 and manually run by the user at the end
