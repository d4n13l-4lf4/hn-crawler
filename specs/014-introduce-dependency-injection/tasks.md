# Tasks: Introduce Dependency Injection

**Input**: Design documents from `/specs/014-introduce-dependency-injection/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only include them if explicitly requested in the feature specification. The spec states "No new tests are written for this feature; existing tests validate the unchanged behavior." No test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create `src/bootstrap/` directory for DI wiring per implementation plan

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Create `src/bootstrap/tokens.ts` with Symbol tokens for all container bindings (Config, EntrySource, HttpClient, AxiosInstance, SqliteClient, UsageRepository, CrawlerUseCase, TrackedCrawlerUseCase, UsageQueryUseCase, PipelineFactory, SqliteMigrator, SqlitePathResolver)
- [ ] T003 [P] Create `src/bootstrap/binding.map.ts` with binding type definitions mapping tokens to concrete types and singleton scope

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - CLI behaves identically after DI refactor (Priority: P1) [US1] 🎯 MVP

**Goal**: Introduce DI via inversify so the CLI behaves identically after the refactor — same commands, output, exit codes, error handling for crawl and usage subcommands.

**Independent Test**: Run the CLI before and after the refactor and compare command output, exit codes, and error handling for all existing crawl and usage subcommands.

### Implementation for User Story 1

- [ ] T004 [US1] Create `src/bootstrap/container.ts` with `createContainer` function that assembles the inversify container with all singleton bindings (depends on T002, T003)
- [ ] T005 [US1] Refactor `src/main.ts` — move composition root from `src/presentation/main.ts`, use `createContainer()` at startup, resolve migration dependencies and execute migration, resolve use cases and pass to CLI commands, preserve error handling and database close (depends on T004)
- [ ] T006 [US1] Delete `src/presentation/main.ts` — remove old composition root now replaced by `src/main.ts` (depends on T005)
- [ ] T007 [US1] Update `vitest.config.mts` coverage exclusion — add `src/bootstrap/` and `src/main.ts` to the exclude list (replacing the old `src/presentation/main.ts` exclusion) (depends on T005)
- [ ] T008 [US1] Run quality gates (`npm run quality`) to verify format, lint, typecheck, and 100% coverage pass with no regressions (depends on T005, T006, T007)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently — CLI behaves identically before and after the DI refactor

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories / documentation updates

- [ ] T009 [P] Update `docs/ARCHITECTURE.md` — composition root path (`src/presentation/main.ts` → `src/main.ts`), project structure tree (add `src/bootstrap/`), folder responsibilities table, technologies table (add inversify + strongly-typed)
- [ ] T010 [P] Update `docs/QA.md` — coverage exclusion path (`src/presentation/main.ts` → `src/main.ts` plus `src/bootstrap/`) and note that `inversify` DI is application-level only, not for unit testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on User Story 1 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (only story in this feature)

### Within User Story 1

- T002, T003 (Foundational) before T004
- T004 before T005
- T005 before T006, T007
- T005, T006, T007 before T008

### Parallel Opportunities

- T002 and T003 (Foundational) can run in parallel - different files, no dependencies
- T009 and T010 (Polish) can run in parallel - different files, no dependencies

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tasks together:
Task: "Create src/bootstrap/tokens.ts with Symbol tokens for all container bindings"
Task: "Create src/bootstrap/binding.map.ts with binding type definitions mapping tokens to concrete types and singleton scope"
```

---

## Parallel Example: Polish Phase

```bash
# Launch all polish tasks together:
Task: "Update docs/ARCHITECTURE.md — composition root path, project structure tree, folder responsibilities, technologies table"
Task: "Update docs/QA.md — coverage exclusion path"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently — CLI behaves identically before and after the DI refactor
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Each story adds value without breaking previous stories (only one story in this feature)

### Milestones for Review

- **Milestone 1** (after T002, T003): `src/bootstrap/tokens.ts` and `src/bootstrap/binding.map.ts` created — binding types defined
- **Milestone 2** (after T004): `src/bootstrap/container.ts` created — `createContainer` function assembles DI container
- **Milestone 3** (after T005, T006): `src/main.ts` refactored as composition root using container; `src/presentation/main.ts` deleted
- **Milestone 4** (after T007, T008): Coverage config updated; quality gates pass
- **Milestone 5** (after T009, T010): Documentation updated (ARCHITECTURE.md, QA.md)

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] label maps task to User Story 1 for traceability
- User Story 1 is independently completable and testable
- No test tasks generated — spec states "No new tests are written for this feature; existing tests validate the unchanged behavior"
- `inversify` DI is used at the application level only — NOT for unit testing
- `src/bootstrap/` folder and `src/main.ts` excluded from unit tests AND unit tests coverage
- CLI commands are NOT integrated into the container (deferred per plan) — use cases are resolved from container and passed to command constructors manually
- All classes bound as singletons per plan
- Delete unused files: `src/presentation/main.ts` is removed after migration to `src/main.ts`
- Commit after each milestone or logical group
- Stop at each checkpoint to validate story independently
