# Quickstart Validation Guide: Configure SonarCloud Analysis in CI

**Feature**: 012-sonar-cloud-ci  
**Date**: 2026-11-20

## Purpose

Document runnable validation scenarios that prove the SonarCloud CI configuration works end-to-end: coverage generates `lcov.info`, the Sonar properties reference the correct locations, and the CI workflow includes a scan step after coverage. This guide is a validation/run reference; implementation details belong in `tasks.md` and the implementation phase.

## Prerequisites

- A SonarCloud account/organization is available and accessible from the CI environment.
- The CI repository secret `SONAR_TOKEN` is configured with a valid SonarCloud token.
- Placeholders `sonar.projectKey` and `sonar.organization` are replaced with actual values before CI execution.
- Build completed: `npm run build`
- Quality gates pass: `npm run quality`

## Validation scenarios

Run each scenario locally or in CI and compare to expected outcomes.

### 1. Coverage generates lcov.info

```
npm run test:coverage
```

Expected outcome:

- `coverage/lcov.info` exists after the run.
- All vitest coverage reporters (`text`, `json`, `html`, `lcov`) produce output.
- Coverage thresholds (100% statements, branches, functions, lines per file) are met.
- Exit code is 0.

### 2. Sonar properties match vitest configuration

Review `sonar-project.properties` and `vitest.config.mts` side by side.

Expected outcome:

- `sonar.sources` = `src` matches vitest coverage `include: ['src/**/*.ts']`.
- `sonar.exclusions` matches vitest coverage `exclude` patterns.
- `sonar.tests` = `tests/unit` matches vitest test `include`.
- `sonar.test.inclusions` matches vitest test `include` patterns.
- `sonar.typescript.lcov.reportPaths` = `coverage/lcov.info`.
- `sonar.token` is not hardcoded; it references `${{ secrets.SONAR_TOKEN }}`.

### 3. CI workflow includes SonarCloud scan step

Review `.github/workflows/ci.yml`.

Expected outcome:

- A SonarCloud scan step exists after the "Run quality gates" step.
- The scan step runs after `npm run quality` so `coverage/lcov.info` is available.
- `sonar.token` is sourced from `${{ secrets.SONAR_TOKEN }}`.
- `sonar.projectKey` and `sonar.organization` use placeholders.

### 4. No functional behavior change

Run the unit test suite:

```
npm run test:unit
```

Expected outcome:

- All existing unit tests pass (196+ tests).
- Coverage remains at 100%.
- Exit code is 0.

Acceptance tests (Cucumber) are not modified and are run manually by the user at the end of the implementation; the agent does not execute them.

## Verifying the refactor

- Run `npm run quality` (format, lint, typecheck, test+coverage) — must be fully green.
- Run `npm run build` — must succeed.
- No new CLI options, commands, or output formats are introduced.
- Application runtime behavior is unchanged.

## References

- Feature specification: `specs/012-sonar-cloud-ci/spec.md`
- Implementation plan: `specs/012-sonar-cloud-ci/plan.md`
- Data model: `specs/012-sonar-cloud-ci/data-model.md`
- Research decisions: `specs/012-sonar-cloud-ci/research.md`
- Contracts: none (the CLI command contract is unchanged by this CI configuration change)
