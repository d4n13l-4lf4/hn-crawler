# Tasks: Persist Usage History

**Input**: Design documents from `/specs/005-usage-db-persistence/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/usage-cli.md`, `quickstart.md`

**Tests**: TDD is required. Acceptance scenarios are added first but MUST NOT be executed for this feature. Unit and integration tests follow the repository's table-driven `it should when` style and verify results plus important dependency calls/arguments. Maintain 100% unit coverage.

**Organization**: Tasks are ordered by shared infrastructure and user story. Each milestone ends with non-acceptance quality gates and a user review pause.

## Phase 1: Acceptance Contract (Write First, Do Not Run)

**Purpose**: Define the black-box persistence journey before implementation while keeping acceptance execution out of scope.

- [x] T001 [P] [US1] Add a black-box scenario that runs `crawl` and then `usage` as two separate CLI invocations sharing one temporary database path in `tests/acceptance/features/usage.feature`
- [x] T002 [P] [US2] Add usage table scenarios for persisted history, aligned columns, and empty history in `tests/acceptance/features/usage.feature`
- [x] T003 [P] [US3] Omit the 100-record acceptance scenario as explicitly scoped; retention remains a unit/integration concern documented in the plan
- [x] T004 Implement black-box subprocess steps that share a temporary DB path between invocations and clean it up in `tests/acceptance/steps/usage.steps.ts`
- [x] T005 Verify feature/step wording and run `npm run lint` and `npm run typecheck`; do not run acceptance tests. Formatting is valid for TypeScript; Prettier does not parse Gherkin and the repository format gate currently reports an unrelated existing plan formatting issue. Pause for review.

**Checkpoint**: Acceptance scenarios describe the intended CLI behavior and remain unexecuted.

## Phase 2: Foundation - Dependencies, Configuration, Schema, and Migrations

**Purpose**: Add the DB toolchain and schema required by the persistence and display stories.

- [ ] T006 Add `drizzle-orm`, `drizzle-kit`, and `env-paths` dependencies in `package.json` and update the lockfile
- [ ] T007 [P] Add a validated usage retention limit with default 100 and test-only DB path override to `src/config/config.ts`
- [ ] T008 [P] Define the Drizzle usage table matching the four-field `Usage` entity in `src/infrastructure/persistence/sqlite/schema/usage.schema.ts`
- [ ] T009 Configure Drizzle Kit to use the SQLite schema and `drizzle/migrations/` output in `drizzle.config.ts`
- [ ] T010 Generate and review the initial usage-table migration under `drizzle/migrations/`
- [ ] T011 Add local migration generation and inspection scripts in `package.json`
- [ ] T012 Include `drizzle/migrations/` and required migration metadata in the published package `files` list in `package.json`
- [ ] T013 Add table/config tests for schema columns, constraints, retention default/override, and invalid retention values in `tests/unit/infrastructure/persistence/sqlite/schema/usage.schema.test.ts` and `tests/unit/config/config.test.ts`
- [ ] T014 Run `npm run quality` and `npm run build`; pause for review

**Checkpoint**: Dependencies, configuration, schema, migration artifacts, and package inclusion are reviewable and green.

## Phase 3: User Story 1 - Persist Crawl Usage (Priority: P1)

**Goal**: Persist crawl usage to a per-user SQLite file so records survive independent CLI invocations, without changing crawl outcomes when writes fail.

**Independent Test**: With a temporary database path, save a usage entity, close/reopen the DB, and retrieve the same record. Verify retention and best-effort write behavior with a small configured limit.

### Tests for User Story 1

- [ ] T015 [P] [US1] Add table-driven tests for default env-path resolution, test-path override, and directory creation in `tests/unit/infrastructure/persistence/sqlite/sqlite-path.test.ts`
- [ ] T016 [P] [US1] Add tests for successful startup migration, repeat startup, migration failure, and temporary DB cleanup in `tests/unit/infrastructure/persistence/sqlite/sqlite-migrator.test.ts`
- [ ] T017 [P] [US1] Add table-driven repository tests for save/get mapping, insertion ordering, persistence after reopen, retention default/custom/reduction, and transactional failures in `tests/unit/infrastructure/persistence/sqlite/repositories/usage.repository.test.ts`
- [ ] T018 [US1] Add tracked-crawler integration coverage proving SQLite save failures preserve successful results and original crawl errors in `tests/unit/application/usecases/decorators/tracked-crawler.sqlite.test.ts`

### Implementation for User Story 1

- [ ] T019 [US1] Implement `sqlite-path.ts` using `env-paths('hn-crawler')`, a database filename, safe test override, and recursive data-directory creation in `src/infrastructure/persistence/sqlite/sqlite-path.ts`
- [ ] T020 [US1] Implement the SQLite connection/client using the selected Drizzle adapter and `node:sqlite` in `src/infrastructure/persistence/sqlite/sqlite.client.ts`
- [ ] T021 [US1] Implement programmatic Drizzle migration loading from packaged `drizzle/migrations/` in `src/infrastructure/persistence/sqlite/sqlite-migrator.ts`
- [ ] T022 [US1] Implement `UsageRepositoryPort` save/getAll operations and transactional insertion-sequence retention pruning in `src/infrastructure/persistence/sqlite/repositories/usage.repository.ts`
- [ ] T023 [US1] Wire SQLite path, client, migrations, and repository in `src/presentation/main.ts` before command dispatch while preserving best-effort crawl tracking
- [ ] T024 [US1] Run focused persistence tests, `npm run quality`, and `npm run build`; pause for review

**Checkpoint**: Usage entries are stored in SQLite across process lifetimes; writes remain best effort and retention is bounded.

## Phase 4: User Story 2 - View Usage in a Readable Table (Priority: P1)

**Goal**: Display persisted usage records in a readable, aligned ASCII table.

**Independent Test**: Supply records with varied lengths and delimiter/newline characters to `usage`; verify exact headings/field order, alignment, single-line rows, empty history, and read-error exit behavior.

### Tests for User Story 2

- [ ] T025 [P] [US2] Add table-driven formatter tests for widths, alignment, UUID ID, empty history, delimiters, and line breaks in `tests/unit/presentation/cli/usage.test.ts`
- [ ] T026 [P] [US2] Add usage command tests for database retrieval output and clear non-zero read failures in `tests/unit/presentation/cli/usage.test.ts`

### Implementation for User Story 2

- [ ] T027 [US2] Replace JSON serialization with `Usage data` ASCII table output using columns ID, Request Timestamp, Applied Filters, and Duration (ms) in `src/presentation/cli/usage.ts`
- [ ] T028 [US2] Ensure table rendering sanitizes delimiter/newline characters without dropping field content or creating extra rows in `src/presentation/cli/usage.ts`
- [ ] T029 [US2] Run usage CLI unit tests, `npm run quality`, and `npm run build`; pause for review

**Checkpoint**: The usage command presents persisted history in the documented readable table format.

## Phase 5: User Story 3 - Limit Stored History (Priority: P1)

**Goal**: Retain only the newest configured number of records, default 100.

**Independent Test**: Save more than a small configured limit, restart or reopen the DB, and verify the newest rows remain in insertion order.

### Tests for User Story 3

- [ ] T030 [P] [US3] Add repository tests proving the default limit is 100 and the newest 100 survive an over-limit write sequence in `tests/unit/infrastructure/persistence/sqlite/repositories/usage.repository.test.ts`
- [ ] T031 [P] [US3] Add repository tests proving custom limit and configuration reduction prune oldest rows on the next save in `tests/unit/infrastructure/persistence/sqlite/repositories/usage.repository.test.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Apply the configured retention limit atomically with each save and preserve newest-first selection/insertion-order retrieval in `src/infrastructure/persistence/sqlite/repositories/usage.repository.ts`
- [ ] T033 [US3] Verify retention config validation and default wiring through the composition root in `src/config/config.ts` and `src/presentation/main.ts`
- [ ] T034 [US3] Run focused retention tests, `npm run quality`, and `npm run build`; pause for review

**Checkpoint**: The persisted history remains bounded by application configuration.

## Phase 6: Integration, Packaging, and Final Non-Acceptance Gates

**Purpose**: Verify startup migration, repository sharing, package contents, and documented local commands without executing acceptance tests.

- [ ] T035 [US1] Ensure startup migration completes before usage or crawl command handling and reports migration failure as a clear non-zero startup error in `src/presentation/main.ts`
- [ ] T036 [US1] Verify the test-only database path is honored by acceptance subprocesses while normal CLI runs use `env-paths` in `src/infrastructure/persistence/sqlite/sqlite-path.ts` and `tests/acceptance/steps/usage.steps.ts`
- [ ] T037 [US1] Verify migration SQL and metadata are present in the packed package contents and local migration scripts work without running acceptance tests; update `package.json` and `specs/005-usage-db-persistence/quickstart.md` if needed
- [ ] T038 Run `npm run quality` and `npm run build`, inspect acceptance tests and scripts without executing them, record results, and pause for final review

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Acceptance Contract)**: First by TDD; acceptance remains unrun.
- **Phase 2 (Foundation)**: Blocks DB path/client/migration/repository implementation.
- **Phase 3 (US1)**: Depends on configuration, schema, migration artifacts, and foundation.
- **Phase 4 (US2)**: Depends on the repository read path from US1.
- **Phase 5 (US3)**: Repository retention can be tested alongside US1, but its review checkpoint follows the persistence milestone.
- **Phase 6**: Depends on all implementation stories.

### User Story Dependencies

- **US1**: Persistence and best-effort writes; depends on Phase 2.
- **US2**: Table output from persisted reads; depends on US1 repository integration.
- **US3**: Bounded record retention; depends on the SQLite repository introduced for US1. Its repository logic can be implemented in the same code increment as US1 but is validated as a separate story milestone.

### Parallel Opportunities

- T007, T008, and T009 use separate files and can proceed in parallel after the dependencies are chosen.
- T015, T016, and T017 are independent test files and can be authored in parallel before their corresponding implementations; T018 is separate integration coverage.
- T025 and T026 share the same test file and should be combined or done sequentially.
- T030 and T031 share the repository test file and should be combined or done sequentially.
- Acceptance scenarios T001–T004 touch shared feature/step artifacts and should be completed as one small milestone before implementation.

### Parallel Example: Foundation

```text
Task: T007 retention and test path config in src/config/config.ts
Task: T008 usage schema in src/infrastructure/persistence/sqlite/schema/usage.schema.ts
Task: T009 drizzle.config.ts
```

### Implementation Strategy

#### MVP First

Complete Phase 1, then Phase 2, then US1 persistence. Pause for review after each milestone. The first working increment should support DB path selection, migration at startup, writing and reading a persisted usage record, and best-effort writes.

#### Incremental Delivery

1. Author acceptance scenarios; leave them unrun.
2. Add DB dependencies, schema, migrations, config, and package metadata.
3. Implement path/client/migrator and persistence repository; review with non-acceptance gates.
4. Replace JSON output with table rendering and validate it through unit tests.
5. Validate retention behavior and final packaging/build.
6. Acceptance execution is out of scope for this feature.

## Notes

- Acceptance tests are authored first but MUST NOT be run in this feature.
- Do not add a 100-record acceptance scenario. Test retention limits in unit/integration tests with small values; default behavior is also covered in repository tests.
- Normal DB path is per-user via `env-paths('hn-crawler')`; tests override the path to a temporary file shared by separate subprocess invocations.
- Unit tests use `it should when` naming and table-driven cases; assert outputs and significant mock calls/arguments.
- Keep obsolete in-memory usage repository tests only if the adapter remains used elsewhere; delete them if no longer relevant once SQLite composition is wired.
