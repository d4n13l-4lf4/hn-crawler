---
description: 'Task list for Base Project Scaffolding implementation'
---

# Tasks: Base Project Scaffolding

**Input**: Design documents from `/specs/001-base-project-scaffolding/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: The spec explicitly requests unit tests and acceptance tests. Tests are included per user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic configuration files

- [x] T001 Initialize npm project with `package.json` at `package.json`
- [x] T002 [P] Create TypeScript strict config at `tsconfig.json`
- [x] T003 [P] Create Node version pin at `.nvmrc` (v26 LTS)
- [x] T004 [P] Create `.gitignore` excluding `dist/`, `node_modules/`, `*.log`, `.sqlite`
- [x] T005 [P] Create `README.md` with project description and usage instructions
- [x] T006 Install all dependencies: `commander`, `cheerio`, `vitest`, `@cucumber/cucumber`, `prettier`, `eslint`, `husky`, `typescript`, `@types/node`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hexagonal architecture folder structure and core configuration that ALL user stories depend on

⚠️ **CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create domain layer folders: `src/domain/`
- [x] T008 Create application layer folders: `src/application/ports/`, `src/application/pipeline/steps/`, `src/application/pipeline/composed/`
- [x] T009 Create infrastructure layer folders: `src/infrastructure/web/`, `src/infrastructure/persistence/`
- [x] T010 Create presentation layer folder: `src/presentation/`
- [x] T011 Create test folders: `tests/fixtures/`, `tests/unit/`, `tests/acceptance/features/`, `tests/acceptance/steps/`
- [x] T012 Create `.github/workflows/` folder for CI/CD workflows
- [x] T013 Create `.husky/` folder for git hooks
- [x] T014 Create `docs/` folder (already exists)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Hello World CLI Command (Priority: P1) 🎯 MVP

**Goal**: Implement the `hn-crawler` CLI with a default "Hello World" action that validates the entire toolchain works end-to-end

**Independent Test**: Run `node dist/presentation/main.js` → outputs "Hello World" with exit code 0; `hn-crawler --help` shows usage

### Tests for User Story 1 (TDD: Write tests FIRST, ensure they FAIL)

- [x] T015 [P] [US1] Create unit test for CLI default action at `tests/unit/presentation/cli.test.ts` (verifies "Hello World" output)
- [x] T016 [P] [US1] Create acceptance test feature at `tests/acceptance/features/hello-world.feature` (Gherkin scenario for CLI hello world)
- [x] T017 [P] [US1] Create acceptance test steps at `tests/acceptance/steps/hello-world.steps.ts` (spawns CLI binary, asserts output)

### Implementation for User Story 1

- [x] T018 [P] [US1] Create domain model stub at `src/domain/models.ts` (minimal exports for CLI command type)
- [x] T019 [P] [US1] Create domain text utilities stub at `src/domain/text-utils.ts` (minimal exports)
- [x] T020 [P] [US1] Create entry-source port at `src/application/ports/entry-source.port.ts`
- [x] T021 [P] [US1] Create usage-repo port at `src/application/ports/usage-repo.port.ts`
- [x] T022 [P] [US1] Create pipeline pipe at `../../src/application/pipeline/orchestration`
- [x] T023 [P] [US1] Create pipeline operators at `src/application/pipeline/operators.ts`
- [x] T024 [P] [US1] Create pipeline types declaration at `src/application/pipeline/pipeline.types.d.ts`
- [x] T025 [P] [US1] Create filter step stubs (4 files) at `src/application/pipeline/steps/`:
  - `filter-more-than-five-words.step.ts`
  - `filter-up-to-five-words.step.ts`
  - `top-by-comments.step.ts`
  - `top-by-points.step.ts`
- [x] T026 [P] [US1] Create composed pipeline stubs (2 files) at `src/application/pipeline/composed/`:
  - `long-titles.pipeline.ts`
  - `short-titles.pipeline.ts`
- [x] T027 [P] [US1] Create use case stub at `src/application/crawl-hn.use-case.ts`
- [x] T028 [P] [US1] Create infrastructure web stubs (3 files) at `src/infrastructure/web/`:
  - `hn-http.client.ts`
  - `hn-cheerio.parser.ts`
  - `hn-web.adapter.ts`
- [x] T029 [P] [US1] Create infrastructure persistence stub at `src/infrastructure/persistence/sqlite-usage.repo.ts`
- [x] T030 [US1] Create CLI command definition at `src/presentation/cli.ts` (Commander setup with default action, --help, --version)
- [x] T031 [US1] Create composition root at `src/presentation/main.ts` (instantiates CLI, wires dependencies)
- [x] T032 [US1] Add bin entry to `package.json` pointing to `dist/presentation/main.js`
- [x] T033 [US1] Verify build compiles: `npm run build` → `dist/presentation/main.js` exists
- [x] T034 [US1] Verify CLI runs: `node dist/presentation/main.js` → "Hello World", exit 0
- [x] T035 [US1] Verify help: `node dist/presentation/main.js --help` → usage displayed, exit 0

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Quality Gates Enforcement (Priority: P1)

**Goal**: Configure and enforce all four quality gates (format, lint, typecheck, test+coverage) on commit and in CI

**Independent Test**: Introduce formatting/lint/type/coverage error → commit blocked; CI workflow fails on error

### Implementation for User Story 2

- [x] T040 [P] [US2] Create Prettier config at `.prettierrc` (or `prettier.config.js`)
- [x] T041 [P] [US2] Create ESLint config at `eslint.config.js` (flat config, TypeScript support)
- [x] T042 [P] [US2] Create Vitest config at `vitest.config.ts` (coverage with v8, exclude main.ts, 100% thresholds)
- [x] T043 [US2] Add quality gate scripts to `package.json`:
  - `format:check`: `prettier --check .`
  - `lint`: `eslint src tests`
  - `typecheck`: `tsc --noEmit`
  - `test:coverage`: `vitest run --coverage`
  - `quality`: `npm run format:check && npm run lint && npm run typecheck && npm run test:coverage`
  - `test:acceptance`: `cucumber-js tests/acceptance`
  - `build`: `tsc`
  - `prepare`: `husky install`
- [x] T044 [US2] Create Husky pre-commit hook at `.husky/pre-commit` (runs `npm run quality`)
- [x] T045 [US2] Verify pre-commit blocks on format error (stage bad file, attempt commit)
- [x] T046 [US2] Verify pre-commit blocks on lint error
- [x] T047 [US2] Verify pre-commit blocks on type error
- [x] T048 [US2] Verify pre-commit blocks on coverage < 100%
- [x] T049 [US2] Run `npm run quality` — all four gates pass

**Checkpoint**: Quality gates enforced on every commit and runnable via `npm run quality`

---

## Phase 5: User Story 3 - CI/CD Workflow for Beta Releases (Priority: P1)

**Goal**: Create four GitHub Actions workflows (ci, beta-release, acceptance-tests, release) per CICD.md

**Independent Test**: Merge PR to `release/**` → `beta-release` publishes beta and exact-version artifact → `acceptance-tests` installs that exact beta; merge release PR to `main` → `release` publishes the production version

### Implementation for User Story 3

- [x] T054 [P] [US3] Create CI workflow at `.github/workflows/ci.yml`:
  - Triggers: PR to `release/**` or `main`
  - Jobs: runs `npm run quality` (all 4 gates)
  - Uses Node from `.nvmrc`
- [x] T055 [P] [US3] Create beta-release workflow at `.github/workflows/beta-release.yml`:
  - Triggers: PR closed and merged into `release/**`
  - Derives beta version: `${version}-beta.sha${shortSha}`
  - Publishes to npm with `--tag beta`
  - Uploads version artifact
- [x] T056 [P] [US3] Create acceptance-tests workflow at `.github/workflows/acceptance-tests.yml`:
  - Triggers: `beta-release` completed successfully
  - Downloads beta version artifact
  - Installs the exact version from the artifact
  - Runs acceptance tests against installed CLI
- [x] T057 [P] [US3] Create release workflow at `.github/workflows/release.yml`:
  - Triggers: PR merged to `main`
  - Publishes `package.json` version to npm `latest` tag
- [x] T058 [US3] Add `NPM_TOKEN` secret documentation to README
- [x] T059 [US3] Verify workflow YAML syntax with `yamllint` or GitHub Actions validator

**Checkpoint**: All four workflows created and syntactically valid

---

## Phase 6: User Story 4 - Project Structure and Libraries (Priority: P2)

**Goal**: Verify complete hexagonal architecture structure, dependencies, and configuration match ARCHITECTURE.md exactly

**Independent Test**: Fresh clone → `npm install` → all deps install → folder structure matches ARCHITECTURE.md → `npm run quality` passes

### Implementation for User Story 4

- [x] T062 [US4] Verify all domain files exist and export minimal stubs:
  - `src/domain/models.ts`
  - `src/domain/text-utils.ts`
- [x] T063 [US4] Verify all application files exist and export minimal stubs:
  - `src/application/ports/entry-source.port.ts`
  - `src/application/ports/usage-repo.port.ts`
  - `../../src/application/pipeline/orchestration`
  - `src/application/pipeline/operators.ts`
  - `src/application/pipeline/pipeline.types.d.ts`
  - `src/application/pipeline/steps/filter-more-than-five-words.step.ts`
  - `src/application/pipeline/steps/filter-up-to-five-words.step.ts`
  - `src/application/pipeline/steps/top-by-comments.step.ts`
  - `src/application/pipeline/steps/top-by-points.step.ts`
  - `src/application/pipeline/composed/long-titles.pipeline.ts`
  - `src/application/pipeline/composed/short-titles.pipeline.ts`
  - `src/application/crawl-hn.use-case.ts`
- [x] T064 [US4] Verify all infrastructure files exist and export minimal stubs:
  - `src/infrastructure/web/hn-http.client.ts`
  - `src/infrastructure/web/hn-cheerio.parser.ts`
  - `src/infrastructure/web/hn-web.adapter.ts`
  - `src/infrastructure/persistence/sqlite-usage.repo.ts`
- [x] T065 [US4] Verify presentation files exist:
  - `src/presentation/cli.ts`
  - `src/presentation/main.ts`
- [x] T066 [US4] Verify all test folders exist per ARCHITECTURE.md:
  - `tests/fixtures/`
  - `tests/unit/` (mirroring `src/`)
  - `tests/acceptance/features/`
  - `tests/acceptance/steps/`
- [x] T067 [US4] Verify `package.json` has all required dependencies and scripts
- [x] T068 [US4] Verify `tsconfig.json` has strict mode, path aliases, NodeNext modules
- [x] T069 [US4] Run full validation: `npm ci && npm run build && npm run quality`
- [x] T070 [US4] Run local acceptance tests with `npm run test:acceptance:local`; reserve `npm run test:acceptance` for CI after installing the exact published beta

**Checkpoint**: Project structure complete and validated against architecture document

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and cleanup

- [x] T071 [P] Update `README.md` with complete setup, usage, and development instructions
- [x] T072 [P] Add `.editorconfig` for consistent editor settings
- [x] T073 Verify quickstart.md validation steps all pass (clone → install → build → run → quality → acceptance)
- [x] T074 Run the local test suite: `npm run test:coverage && npm run test:acceptance:local`; run `test:acceptance` only in CI against the exact installed beta
- [x] T075 Verify TypeScript compilation with no errors: `npm run typecheck`
- [x] T076 Verify all constitutional principles satisfied (review against constitution.md)

## Phase 8: Convergence

- [x] T077 Update convergence prerequisite checks to include existing `spec.md` and `plan.md` in `AVAILABLE_DOCS` per plan: prerequisite detection (partial)
- [x] T078 Align the Vitest configuration filename in task T042 and the implementation with the chosen `.mts` config filename per plan: Vitest configuration (partial)

## Phase 13: Convergence

- [x] T114 Implement the specified stream pipeline operators per FR-012, Constitution III (partial)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion
- **User Story 3 (Phase 5)**: Depends on Foundational completion
- **User Story 4 (Phase 6)**: Depends on Foundational completion (verifies it)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

| Story                   | Priority | Depends On   | Can Run Parallel After Foundational? |
| ----------------------- | -------- | ------------ | ------------------------------------ |
| US1 - Hello World CLI   | P1       | Foundational | ✅ Yes                               |
| US2 - Quality Gates     | P1       | Foundational | ✅ Yes                               |
| US3 - CI/CD Workflows   | P1       | Foundational | ✅ Yes                               |
| US4 - Project Structure | P2       | Foundational | ✅ Yes (verification)                |

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation (TDD)
- Models/stubs before CLI/composition root
- Core implementation before integration verification
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T005)
- All Foundational folder creation tasks can run in parallel (T007-T013)
- Once Foundational phase completes, **all four user stories can start in parallel** (if team capacity allows)
- All test tasks within a user story marked [P] can run in parallel
- All stub creation tasks within US1 marked [P] can run in parallel (T018-T029)
- All workflow creation tasks within US3 marked [P] can run in parallel (T054-T057)
- Independent structure/configuration reviews within US4 can be performed in parallel after setup

---

## Parallel Example: User Story 1 (Hello World CLI)

```bash
# Launch all tests for User Story 1 together:
Task: "T015 [P] [US1] Create unit test for CLI default action at tests/unit/presentation/cli.test.ts"
Task: "T016 [P] [US1] Create acceptance test feature at tests/acceptance/features/hello-world.feature"
Task: "T017 [P] [US1] Create acceptance test steps at tests/acceptance/steps/hello-world.steps.ts"

# Launch all stub creation for User Story 1 together:
Task: "T018 [P] [US1] Create domain model stub at src/domain/models.ts"
Task: "T019 [P] [US1] Create domain text utilities stub at src/domain/text-utils.ts"
Task: "T020 [P] [US1] Create entry-source port at src/application/ports/entry-source.port.ts"
Task: "T021 [P] [US1] Create usage-repo port at src/application/ports/usage-repo.port.ts"
Task: "T022 [P] [US1] Create pipeline pipe at src/application/pipeline/pipe.ts"
Task: "T023 [P] [US1] Create pipeline operators at src/application/pipeline/operators.ts"
Task: "T024 [P] [US1] Create pipeline types declaration at src/application/pipeline/pipeline.types.d.ts"
Task: "T025 [P] [US1] Create filter step stubs at src/application/pipeline/steps/ (4 files)"
Task: "T026 [P] [US1] Create composed pipeline stubs at src/application/pipeline/composed/ (2 files)"
Task: "T027 [P] [US1] Create use case stub at src/application/crawl-hn.use-case.ts"
Task: "T028 [P] [US1] Create infrastructure web stubs at src/infrastructure/web/ (3 files)"
Task: "T029 [P] [US1] Create infrastructure persistence stub at src/infrastructure/persistence/sqlite-usage.repo.ts"
```

---

## Parallel Example: User Story 2 (Quality Gates)

```bash
# Launch all config creation together:
Task: "T040 [P] [US2] Create Prettier config at .prettierrc"
Task: "T041 [P] [US2] Create ESLint config at eslint.config.js"
Task: "T042 [P] [US2] Create Vitest config at vitest.config.ts"

# Validate the configured gates by running the quality command after setup:
npm run quality
```

---

## Parallel Example: User Story 3 (CI/CD Workflows)

```bash
# Launch all workflow creation together:
Task: "T054 [P] [US3] Create CI workflow at .github/workflows/ci.yml"
Task: "T055 [P] [US3] Create beta-release workflow at .github/workflows/beta-release.yml"
Task: "T056 [P] [US3] Create acceptance-tests workflow at .github/workflows/acceptance-tests.yml"
Task: "T057 [P] [US3] Create release workflow at .github/workflows/release.yml"

# Validate workflow behavior by running the actual GitHub Actions workflows
# on their documented pull request / release events.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Hello World CLI)
4. **STOP and VALIDATE**: Test User Story 1 independently (`node dist/presentation/main.js` → "Hello World")
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **MVP achieved!**
3. Add User Story 2 → Test independently → Quality gates enforced
4. Add User Story 3 → Test independently → CI/CD pipeline ready
5. Add User Story 4 → Test independently → Structure validated
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Hello World CLI)
   - Developer B: User Story 2 (Quality Gates)
   - Developer C: User Story 3 (CI/CD Workflows)
   - Developer D: User Story 4 (Structure Verification)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Unit tests cover application behavior; quality-gate configuration, project layout, and workflow YAML are validated by running their actual checks/workflows, not by dedicated unit tests
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The stub files in US1 (T018-T029) are minimal exports to satisfy TypeScript imports — real implementation comes in future stories
- All 4 quality gates must pass before any commit (Husky pre-commit)
- 100% coverage required (excluding `src/presentation/main.ts`)

---

## Phase 8: Convergence (Latest Versions + TS Compilation)

**Purpose**: Remediate gaps using latest versions (vitest@5, @vitest/coverage-v8@5) and proper TypeScript compilation for all test files

### CRITICAL — Must fix before quality gates pass

- [x] T078 Update `vitest` and `@vitest/coverage-v8` to latest versions (v5) in `package.json` per FR-008 (missing)
- [x] T079 Fix ESLint config at `eslint.config.js`: add `languageOptions: { parser: require('@typescript-eslint/parser'), parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } }` for TypeScript files per FR-005, FR-006 (partial)
- [x] T080 Ensure `quality` script includes `&& npm run test:coverage` in `package.json` per FR-004, SC-006 (missing)

### HIGH — Blocks acceptance tests and CI/CD correctness

- [x] T081 Fix acceptance test steps at `tests/acceptance/steps/hello-world.steps.ts`: use Node `assert` (already done); ensure step patterns match feature file per FR-015, SC-005 (partial)
- [x] T082 Update `acceptance-tests.yml` workflow: download `version-*` artifact from `beta-release`, install exact beta version (e.g., `npm install hn-crawler@1.0.0-beta.sha...`) instead of `@beta` tag per FR-011, SC-004, SC-005, CICD.md (missing)
- [x] T083 Fix `ci.yml` trigger: remove `push: branches: ['main']` (should only run on PR per CICD.md table) per FR-010, SC-003 (missing)

### MEDIUM — Polish and alignment

- [x] T084 Update `README.md` to reflect current MVP status (Hello World only; scraping/filtering/SQLite are future stories) per FR-019 (missing)
- [x] T085 Review `.editorconfig` — justify inclusion or add to tasks per plan.md Phase 7 T072 (unrequested)
- [x] T086 Verify `beta-release.yml` uploads beta version as artifact per CICD.md "upload an artifact with the version" (partial)

### LOW — Optional improvements

- [x] T087 Run full local validation with `npm ci && npm run build && npm run quality && npm run test:acceptance:local`; reserve `npm run test:acceptance` for CI after installing the exact published beta per quickstart.md (partial)

---

## Phase 9: TypeScript Test Compilation Setup

**Purpose**: Configure proper TypeScript compilation for all test files (unit, integration, acceptance) so they can run without ts-node

### CRITICAL — Foundation for all test execution

- [x] T088 Configure production TypeScript compilation to include only src; run tests directly as TypeScript (supersedes test compilation)
- [x] T089 Keep test execution in Vitest/Cucumber without a build:tests script (supersedes test compilation)
- [x] T090 Configure `test:acceptance` for the already-installed CLI used by CI; keep local validation on `test:acceptance:local` per FR-015 (missing)
- [x] T091 Keep test:coverage running Vitest directly against TypeScript tests (supersedes compilation step)
- [x] T092 Keep quality running its four gates without compiling tests (supersedes build:tests)

### HIGH — CI/CD integration

- [x] T093 Run CI quality with Vitest TypeScript execution; do not add a test compilation step (supersedes build:tests)
- [x] T094 Run acceptance support code as TypeScript and install the exact beta CLI; do not compile test files (supersedes dist/tests)

### MEDIUM — Validation

- [x] T095 Verify unit tests run via Vitest (already uses ESM, no compilation needed) per FR-014 (partial)
- [x] T096 Verify acceptance steps execute directly as TypeScript via tsx (supersedes compiled JavaScript)
- [x] T097 Validate npm ci, production build, quality, and local acceptance without compiling test files (supersedes build:tests)

---

## Phase 10: Convergence (Latest Versions + Full Test Pipeline)

**Purpose**: Close remaining gaps — upgrade to vitest v5, fix ESLint TS parsing, complete quality script, implement test compilation pipeline, fix CI/CD artifact usage

### CRITICAL — Must fix for quality gates to pass

- [x] T098 Upgrade `vitest` and `@vitest/coverage-v8` to latest v5 in `package.json` (remove version pins, use `npm install vitest @vitest/coverage-v8 --save-dev`) per FR-008 (partial)
- [x] T099 Fix ESLint config at `eslint.config.js`: add `languageOptions: { parser: require('@typescript-eslint/parser'), parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } }` for TypeScript files per FR-005, FR-006 (partial)
- [x] T100 Keep quality on the four gates with TypeScript tests executed directly; do not add test compilation

### HIGH — Blocks acceptance tests and CI/CD correctness

- [x] T101 Do not create a separate test tsconfig; Vitest and Cucumber execute tests directly as TypeScript (supersedes test compilation)
- [x] T102 Do not add build:tests; tests execute directly as TypeScript (supersedes test compilation)
- [x] T103 Keep `test:acceptance` for the pre-installed exact beta used by CI, and use `test:acceptance:local` for local validation per FR-015, T090 (missing)
- [x] T104 Keep test:coverage as direct Vitest TypeScript execution (supersedes test compilation)
- [x] T105 Update `acceptance-tests.yml`: download `version-*` artifact from `beta-release`, install exact beta version (e.g., `npm install hn-crawler@1.0.0-beta.sha...`) instead of `@beta` tag per FR-011, SC-004, SC-005, CICD.md, T082 (missing)
- [x] T106 Run CI quality without compiling test files; Vitest executes TypeScript tests directly (supersedes build:tests)
- [x] T107 Run acceptance steps as TypeScript against the installed beta CLI; do not use dist/tests (supersedes test compilation)

### MEDIUM — Polish

- [x] T108 Review `.editorconfig` — justify inclusion per plan.md Phase 7 T072, T085 (unrequested)
- [x] T109 Validate npm ci, production build, quality, and local acceptance without compiling test files (supersedes build:tests)

---

## Phase 11: Convergence

- [x] T110 Add tests for in-scope source modules and make `npm run quality` pass all four coverage dimensions at 100%, keeping coverage instrumentation aligned with the Hello World scaffolding scope per FR-008, SC-002 (partial)
- [x] T111 Keep `test:acceptance:local` as the local command (build and install the working tree package before running scenarios); reserve `test:acceptance` for CI after installing the exact published beta per US1/AC1, FR-015 (partial)
- [x] T112 Set `package.json` to the computed beta version before `npm publish` in `.github/workflows/beta-release.yml`, then upload an artifact that records that exact published version per FR-011, SC-004, CICD.md (contradicts)

---

## Phase 12: Convergence

- [x] T113 Add a Cucumber acceptance scenario and step in `tests/acceptance/features/hello-world.feature` and `tests/acceptance/steps/hello-world.steps.ts` that runs `hn-crawler --help` and verifies usage output and exit code 0 per US1/AC2, FR-002 (missing)
