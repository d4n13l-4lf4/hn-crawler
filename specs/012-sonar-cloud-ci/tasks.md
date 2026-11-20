# Tasks: Configure SonarCloud Analysis in CI

**Input**: Design documents from `/specs/012-sonar-cloud-ci/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No test tasks requested — this is a CI pipeline and test-coverage configuration change with no application logic changes. Acceptance tests are NOT modified or added (spec FR-005/SC-004: existing acceptance tests pass with zero modifications; no new acceptance tests). Existing unit tests validate coverage output.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a quality-gate baseline before the refactor begins.

- [x] T001 Verify `npm run quality` passes on the current codebase (baseline before any CI/config changes)

---

## Phase 3: User Story 1 - Automatic code quality analysis in CI (Priority: P1) 🎯 MVP

**Goal**: Configure SonarCloud code quality analysis in the CI pipeline: add an lcov coverage reporter to vitest, create a `sonar-project.properties` file referencing lcov path / source / test locations / inclusions / exclusions in sync with vitest config, and add a SonarCloud scan step to the CI workflow after test coverage. `sonar.token` comes from a repository secret variable; `sonar.projectKey` and `sonar.organization` use placeholders. No application code changes, no user-facing behavior change, no acceptance test modifications.

**Independent Test**: Trigger a CI build on a pushed change and verify the SonarCloud scan step executes after coverage and reports a quality gate outcome.

### Implementation for User Story 1

- [x] T002 [P] [US1] Add `lcov` to the coverage `reporter` array in `vitest.config.mts` (retain existing `text`, `json`, `html` reporters)
- [x] T003 [P] [US1] Create `sonar-project.properties` at repository root with `sonar.projectKey` and `sonar.organization` placeholders, `sonar.sources=src`, `sonar.tests=tests/unit`, `sonar.exclusions` matching vitest coverage `exclude`, `sonar.test.inclusions` matching vitest test `include`, and `sonar.typescript.lcov.reportPaths=coverage/lcov.info`
- [x] T004 [P] [US1] Add a SonarCloud scan step to `.github/workflows/ci.yml` after the "Run quality gates" step, invoking the SonarCloud Scanner with `sonar.token` from `${{ secrets.SONAR_TOKEN }}` and placeholders for project key/organization
- [x] T005 [US1] Run `npm run quality` — must be fully green; config and CI changes must not break format, lint, typecheck, or coverage
- [x] T006 [P] [US1] Verify `npm run build` succeeds after the CI/config changes
- [x] T007 [P] [US1] Confirm `sonar-project.properties` exclusions/inclusions remain in sync with `vitest.config.mts` coverage `include`/`exclude` and test `include`

**Checkpoint**: At this point, User Story 1 is fully functional — CI runs SonarCloud analysis automatically after coverage with quality gate reporting, and no functional behavior changed.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final validation that affects the overall CI configuration change.

- [x] T008 [P] Run `quickstart.md` validation scenarios manually: coverage generates `coverage/lcov.info`, sonar properties match vitest config, CI workflow contains scan step after coverage, token sourced from secret var, no functional behavior change

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. Establishes the quality-gate baseline.
- **User Story 1 (Phase 3)**: Depends on Setup completion. `npm run quality` baseline must be green before CI/config changes.
- **Polish (Final Phase)**: Depends on User Story 1 completion.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) — no dependencies on other stories (single-story feature).

### Within User Story 1

- T002, T003, T004 are independent file edits on different files (vitest config, sonar properties, CI workflow) and can be done in parallel once Setup is complete.
- T005 (quality gate) depends on T002, T003, T004 completion.
- T006 (build verification) depends on T005.
- T007 (sync confirmation) depends on T002, T003.
- T008 (quickstart validation) depends on T005.

### Parallel Opportunities

- T002, T003, T004 ([P]): independent edits on different files with no cross-dependency.
- T006, T007, T008 ([P]): post-quality-gate validation tasks on different concerns.

### Parallel Example: User Story 1

```bash
# Launch implementation tasks together (once Setup is complete):
Task: "Add lcov reporter to vitest.config.mts coverage reporter array"
Task: "Create sonar-project.properties at repository root"
Task: "Add SonarCloud scan step to .github/workflows/ci.yml"

# Launch post-quality-gate validation together:
Task: "Verify npm run build succeeds"
Task: "Confirm sonar-project.properties exclusions/inclusions stay in sync with vitest.config.mts"
Task: "Run quickstart.md validation scenarios manually"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (quality baseline)
2. Complete Phase 3: User Story 1 (CI/config change; T002–T007)
3. **STOP and VALIDATE**: Run `npm run quality` fully green; verify CI workflow contains scan step; verify `npm run build` succeeds
4. Complete Phase N: Polish (quickstart validation)

### Incremental Delivery

1. Setup → Foundation ready, quality green
2. Add User Story 1 → CI/config change → quality green → independently testable MVP
3. Polish → final validation complete

Each increment leaves `npm run quality` green and is presented for review before the next begins (per plan.md milestones).
