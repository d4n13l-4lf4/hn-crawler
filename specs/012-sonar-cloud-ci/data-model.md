# Data Model: Configure SonarCloud Analysis in CI

**Feature**: 012-sonar-cloud-ci  
**Date**: 2026-11-20  
**Status**: Complete

## Entities

No new domain entities are introduced. The feature touches CI pipeline configuration and test-coverage reporting only; existing domain entities and value objects are unchanged.

## Configuration (`sonar-project.properties`)

The following SonarCloud project properties are defined at the repository root:

| Property                            | Value                                                                                                        | Source of truth                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `sonar.projectKey`                  | `<placeholder>`                                                                                              | Placeholder (per user input)                                        |
| `sonar.organization`                | `<placeholder>`                                                                                              | Placeholder (per user input)                                        |
| `sonar.sources`                     | `src`                                                                                                        | vitest coverage `include: ['src/**/*.ts']`                          |
| `sonar.tests`                       | `tests/unit`                                                                                                 | vitest test `include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts']` |
| `sonar.exclusions`                  | `dist/`, `node_modules/`, `src/presentation/main.ts`, `src/**/*.d.ts`, `src/**/ports/**`, `src/**/*.type.ts` | vitest coverage `exclude`                                           |
| `sonar.test.inclusions`             | `tests/**/*.test.ts`, `tests/**/*.spec.ts`                                                                   | vitest test `include`                                               |
| `sonar.typescript.lcov.reportPaths` | `coverage/lcov.info`                                                                                         | vitest coverage reporter `lcov` output                              |
| `sonar.token`                       | `${{ secrets.SONAR_TOKEN }}`                                                                                 | Repository secret variable (CI only)                                |

## Relationships

- `sonar-project.properties` (repo root) is consumed by the SonarCloud Scanner invoked in `.github/workflows/ci.yml`.
- `vitest.config.mts` coverage configuration drives `sonar.sources`, `sonar.exclusions`, and `sonar.typescript.lcov.reportPaths`; the vitest test `include` drives `sonar.tests` and `sonar.test.inclusions`.
- `.github/workflows/ci.yml` runs `npm run quality` (which generates `coverage/lcov.info`) before the SonarCloud scan step.
- `sonar.token` is supplied at runtime from a repository secret variable; it is not stored in `sonar-project.properties`.

## Storage

No storage or schema change. Usage records and the SQLite usage repository are unaffected.

## Acceptance-test environment

Acceptance tests target the CLI via `HN_CRAWLER_WEB_PAGE_BASE_URL`, unchanged by this feature. No new environment variables are required for acceptance; `SONAR_TOKEN` is a CI-only repository secret.
