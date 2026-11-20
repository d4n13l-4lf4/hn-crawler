# Tasks: Refactor for Esbuild Bundle Compatibility

**Input**: Design documents from `/specs/013-esbuild-bundle-compatibility/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Test refactor tasks ARE included — existing unit tests for `cli.ts` and `sqlite-migrator.ts` are refactored test-first (no new tests added, per spec assumption "No new tests are written for this feature"). Acceptance tests are NOT modified or added (spec FR-004/SC-003: existing acceptance tests pass with zero modifications; no new acceptance tests).

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

## Phase 3: User Story 1 - CLI keeps working identically with bundled production binary (Priority: P1) 🎯 MVP

**Goal**: Refactor code to avoid breaking changes introduced by the esbuild production bundle at `dist/main.js`: (1) `cli.ts` displays version via `__APP_VERSION__` bundled variable instead of reading `package.json` via `__dirname`; (2) `sqlite-migrator.ts` locates `drizzle/migrations` via `import.meta.url` instead of `__dirname`. CLI output fields, ordering, error handling, and exit codes remain unchanged. No application behavior changes, no new user-facing options, no acceptance test modifications.

**Independent Test**: Run the bundled production CLI (`dist/main.js`) and verify it produces identical command output, exit codes, and error handling as before for all existing crawl and usage subcommands.

### Tests for User Story 1 (test-first: write and confirm FAIL before implementation)

- [x] T002 [P] [US1] Refactor `tests/unit/presentation/cli/cli.test.ts`: update version assertion to use `__APP_VERSION__` bundled variable instead of package.json read (confirm new tests fail first)
- [x] T003 [P] [US1] Refactor `tests/unit/infrastructure/persistence/sqlite/sqlite-migrator.test.ts`: update migration file location test to use `import.meta.url`-based path resolution (confirm new tests fail first)

### Implementation for User Story 1

- [x] T004 [P] [US1] Refactor `src/presentation/cli/cli.ts`: display version via `__APP_VERSION__` bundled variable; remove `package.json` file read and now-unused imports (`readFileSync`, `dirname`, `resolve`)
- [x] T005 [P] [US1] Refactor `src/infrastructure/persistence/sqlite/sqlite-migrator.ts`: locate `drizzle/migrations` via `import.meta.url` + `fileURLToPath` instead of `__dirname` candidates
- [x] T006 [US1] Run `npm run quality` — must be fully green; config and code changes must not break format, lint, typecheck, or coverage
- [x] T007 [P] [US1] Verify `npm run build` succeeds after the refactor (esbuild bundle generates `dist/main.js`)
- [x] T008 [P] [US1] Delete any now-obsolete code or imports across `src/`; confirm no `__dirname` references remain in `cli.ts` or `sqlite-migrator.ts`

**Checkpoint**: At this point, User Story 1 is fully functional — bundled production CLI runs all existing commands with identical output, exit codes, and error handling; no runtime errors introduced by bundling.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final validation that affects the overall refactor.

- [x] T009 [P] Run `quickstart.md` validation scenarios manually: `hn-crawler --version` shows correct version; migration files located from bundled binary (`dist/main.js`); all CLI subcommands function in the bundle; no functional behavior change

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. Establishes the quality-gate baseline.
- **User Story 1 (Phase 3)**: Depends on Setup completion. `npm run quality` baseline must be green before refactor changes.
- **Polish (Final Phase)**: Depends on User Story 1 completion.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) — no dependencies on other stories (single-story feature).

### Within User Story 1

- Tests (T002, T003) MUST be written and FAIL before implementation (T004, T005).
- T004 and T005 are independent edits on different files and can be done in parallel once tests are written.
- T006 (quality gate) depends on T002–T005 completion.
- T007 (build verification) depends on T006.
- T008 (cleanup) depends on T004–T007.
- T009 (quickstart validation) depends on T006.

### Parallel Opportunities

- T002 and T003 ([P]): test refactors on different files with no cross-dependency.
- T004 and T005 ([P]): implementation edits on different files (`cli.ts`, `sqlite-migrator.ts`) with no cross-dependency.
- T007, T008, T009 ([P]): post-quality-gate validation tasks on different concerns.

### Parallel Example: User Story 1

```bash
# Launch test refactors together (once Setup is complete):
Task: "Refactor tests/unit/presentation/cli/cli.test.ts: version assertion via __APP_VERSION__"
Task: "Refactor tests/unit/infrastructure/persistence/sqlite/sqlite-migrator.test.ts: import.meta.url path resolution"

# Launch implementation together (once tests fail):
Task: "Refactor src/presentation/cli/cli.ts: version via __APP_VERSION__ bundled variable"
Task: "Refactor src/infrastructure/persistence/sqlite/sqlite-migrator.ts: migrations via import.meta.url"

# Launch post-quality-gate validation together:
Task: "Verify npm run build succeeds"
Task: "Delete obsolete code/imports; confirm no __dirname references remain"
Task: "Run quickstart.md validation scenarios manually"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (quality baseline)
2. Complete Phase 3: User Story 1 (the refactor; test-first: T002–T008)
3. **STOP and VALIDATE**: Run `npm run quality` fully green; verify `npm run build` succeeds; verify `hn-crawler --version` works from `dist/main.js`
4. Complete Phase N: Polish (quickstart validation)

### Incremental Delivery

1. Setup → Foundation ready, quality green
2. Add User Story 1 → test-first refactor → quality green → independently testable MVP
3. Polish → final validation complete

Each increment leaves `npm run quality` green and is presented for review before the next begins (per plan.md milestones).
