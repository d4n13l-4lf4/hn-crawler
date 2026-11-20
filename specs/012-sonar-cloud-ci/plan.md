# Implementation Plan: Configure SonarCloud Analysis in CI

**Branch**: `012-sonar-cloud-ci` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-sonar-cloud-ci/spec.md`

## Summary

Configure SonarCloud code quality analysis in the CI pipeline. Add a SonarCloud scan step to the CI workflow after the test coverage run, add an lcov reporter to the vitest coverage configuration, and create a `sonar-project.properties` file at the repository root that references the lcov report path, source locations, test locations, inclusions, and exclusions in sync with the project's unit test configuration. Use placeholders for the SonarCloud project key and organization, and take the SonarCloud token from a repository secret variable. No application code changes, no user-facing behavior change, and no acceptance test modifications. Delivery is incremental: each milestone leaves `npm run quality` green and is presented for review before the next begins.

## Technical Context

**Language/Version**: TypeScript strict mode; Node 26 LTS

**Primary Dependencies**: None new (SonarCloud Scanner invoked in CI; existing vitest + @vitest/coverage-v8 devDependencies reused)

**Storage**: N/A — no storage or schema change

**Testing**: Vitest unit tests with 100% coverage (statements, branches, functions, lines per file and aggregate); Cucumber acceptance intentionally not implemented or run for this feature; acceptance tests are not modified (no functional change)

**Target Platform**: GitHub Actions CI (`ubuntu-latest`, Node 26.x)

**Project Type**: Standalone CLI

**Performance Goals**: N/A — CI configuration change only

**Constraints**:

- No user-facing behavior change: same CLI command, same output fields, same ordering, same error handling, same exit codes
- Existing acceptance scenarios pass unmodified (zero test edits)
- SonarCloud token must come from a repository secret variable (never hardcoded)
- Sonar project key and organization use placeholders
- Sonar properties must stay in sync with vitest coverage `include`/`exclude` and test `include` patterns
- Every implementation milestone must finish with `npm run quality` passing (format, lint, typecheck, test+coverage)
- Acceptance is deferred to the user; the agent does not execute Cucumber
- No new layers, folders, or application dependencies; file naming keeps kebab-case role-suffix convention

**Scale/Scope**: Source files touched: `.github/workflows/ci.yml` (add SonarCloud scan step after quality gates), `vitest.config.mts` (add `lcov` reporter), `sonar-project.properties` (new, repo root: lcov path, src, test locations, inclusions, exclusions). Tests: none new (no functional change); existing unit tests validate coverage output.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Hexagonal architecture**: Pass. This is a CI pipeline and test-coverage configuration change only. No application source, domain, application layer, or infrastructure adapter is modified. The hexagonal dependency rule (`presentation → application → domain`, `infrastructure → application (ports) + domain`) is unaffected.
- **Test-first development**: Pass. No new application logic is introduced, so no new unit tests are required. Existing unit tests continue to validate coverage output; vitest coverage gains an additional `lcov` reporter output format without altering coverage collection. Acceptance tests are not implemented or run for this feature per the spec.
- **Pipes and filters**: N/A. This CI configuration change does not touch pipeline operators or data processing behavior.
- **Simplicity / YAGNI**: Pass. No new application layers, folders, or dependencies. Three files touched/created: CI workflow, vitest config, sonar properties. SonarCloud Scanner is invoked via GitHub Actions (no npm install needed if using the official SonarSource action or scanning via the SonarCloud CLI already available in CI).
- **Deterministic domain rules**: Pass. No domain rules or business logic are affected.

No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/012-sonar-cloud-ci/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── ci.yml                 # Updated: adds SonarCloud scan step after test coverage
vitest.config.mts              # Updated: adds lcov coverage reporter
sonar-project.properties       # NEW: SonarCloud project configuration (lcov path, src, tests, exclusions, inclusions)
```

tests/
└── unit/
└── (unchanged — no new unit tests required; no functional change)

**Structure Decision**: Single project (DEFAULT). Use existing modules only; do not add a new layer or folder. CI workflow, vitest config, and a new `sonar-project.properties` at the repository root are the only files touched/created. No contracts folder is created because the CLI command contract (options, output fields, exit codes) is unchanged by this CI configuration change (consistent with spec 010/011).

## Incremental Delivery and Review Milestones

### Milestone 1: Add lcov reporter to vitest coverage configuration

- Update `vitest.config.mts` to add `lcov` to the coverage `reporter` array (existing reporters `text`, `json`, `html` retained).
- Verify `npm run test:coverage` produces a `coverage/lcov.info` file alongside existing reporters.
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; `coverage/lcov.info` generated; no acceptance tests run. Presented for review before Milestone 2.

### Milestone 2: Create `sonar-project.properties`

- Create `sonar-project.properties` at the repository root:
  - `sonar.projectKey` and `sonar.organization` as placeholders.
  - `sonar.sources` pointing to `src`.
  - `sonar.tests` pointing to `tests/unit`.
  - `sonar.exclusions` matching vitest coverage `exclude` patterns (dist, node_modules, src/presentation/main.ts, src/**/\*.d.ts, src/**/ports/**, src/**/\*.type.ts).
  - `sonar.test.inclusions` matching vitest test `include` patterns (tests/**/\*.test.ts, tests/**/\*.spec.ts).
  - `sonar.typescript.lcov.reportPaths` pointing to `coverage/lcov.info`.
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; `sonar-project.properties` present and consistent with vitest config; no acceptance tests run. Presented for review before Milestone 3.

### Milestone 3: Add SonarCloud scan step to CI workflow

- Update `.github/workflows/ci.yml` to add a SonarCloud scan step after the "Run quality gates" step.
- The step installs/runs the SonarCloud Scanner and invokes analysis with `sonar.token` sourced from a repository secret variable (e.g., `${{ secrets.SONAR_TOKEN }}`), using `sonar.projectKey` and `sonar.organization` placeholders from `sonar-project.properties`.
- The scan step runs after coverage so `coverage/lcov.info` is available.
- Run `npm run quality` — must be green before review.
- Verify workflow YAML is syntactically valid (no `npm run` needed for workflow validation; static inspection suffices).

**Review gate**: `npm run quality` green; CI workflow contains SonarCloud scan step after coverage; token sourced from secret var; no acceptance tests run. Presented for review before Milestone 4.

### Milestone 4: Cleanup + final quality gate

- Confirm no references to obsolete code remain (none expected — this is purely additive CI/config).
- Verify `sonar-project.properties` exclusions/inclusions remain in sync with `vitest.config.mts` coverage `include`/`exclude` and test `include`.
- Run final `npm run quality` — must be fully green.
- Verify `npm run build` succeeds.
- Verify the codebase is left in a clean, green, working state.

**Review gate**: `npm run quality` fully green; `npm run build` succeeds; codebase clean and green; ready for user review.

### Final user-run acceptance

After all milestones are reviewed and approved, the user may trigger a CI build against a pushed change to verify the SonarCloud scan step executes and reports a quality gate outcome. The agent does not execute CI or Cucumber. Any user-reported failure becomes a focused follow-up milestone that must leave `npm run quality` green.

## Complexity Tracking

No additional architecture or constitution exceptions are required.

## Planning Clarification — 2026-11-20

No `[NEEDS CLARIFICATION]` markers remain. All design decisions are resolved with documented assumptions:

- SonarCloud token is taken from a repository secret variable (`${{ secrets.SONAR_TOKEN }}`), per user input.
- SonarCloud project key and organization use placeholders, per user input.
- The SonarCloud Scanner is invoked via GitHub Actions; no npm package is added (consistent with Simplicity/YAGNI).
- `sonar-project.properties` exclusions match vitest coverage `exclude` patterns exactly to keep properties in sync with unit test configuration.
- `sonar.sources` = `src`, `sonar.tests` = `tests/unit`, matching the project's source and unit test locations.
- Acceptance tests are not modified (no functional change), per the spec.
