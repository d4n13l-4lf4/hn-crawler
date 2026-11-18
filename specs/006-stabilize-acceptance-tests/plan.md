# Implementation Plan: Stabilize Acceptance Tests

**Branch**: `006-stabilize-acceptance-tests` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification for acceptance-test stability and isolated SQLite usage data.

## Summary

Make acceptance runs independent of the user's normal database by adding `HN_CRAWLER_DB_PATH` as an explicit full-file override, with precedence over the existing `env-paths` location. The acceptance workflow will create a unique temporary file path and expose it to the CLI subprocesses. Align assertions with Commander-generated `error:` output and remove the obsolete Hello World acceptance feature and step definitions. Unit tests and quality gates will run during implementation; acceptance tests will be left for the user to execute manually.

## Technical Context

**Language/Version**: TypeScript, Node.js 26
**Primary Dependencies**: Commander, Drizzle ORM, node:sqlite, Cucumber, Vitest
**Storage**: SQLite usage DB file; explicit override through `HN_CRAWLER_DB_PATH`, otherwise `env-paths` user data location
**Testing**: Vitest unit tests and Cucumber acceptance tests; acceptance tests are not to be run by implementation agent
**Target Platform**: Node.js CLI on supported developer/CI operating systems; CI workflow runs on Ubuntu
**Project Type**: Standalone TypeScript CLI
**Performance Goals**: No material runtime overhead beyond selecting and creating the configured DB parent directory
**Constraints**: Preserve default per-user DB behavior; explicit DB path has precedence; acceptance workflow generates a unique temporary full path; acceptance suite remains a black-box process test; user will execute acceptance tests manually after implementation
**Scale/Scope**: One SQLite file per application/user normally, one isolated temporary path per acceptance workflow run; no schema or domain model change

## Constitution Check

| Principle | Status | Evidence |
|---|---|---|
| Hexagonal Architecture with Light DDD | PASS | DB path resolution remains in SQLite infrastructure and composition-root configuration; CLI presentation behavior is unchanged. |
| Test-First Development | PASS | Add/update config and SQLite path unit tests, then run unit coverage and quality gates. Acceptance tests are authored/updated but intentionally left for the user to run. |
| Pipes and Filters with Pure Functions | PASS | No crawler pipeline or domain processing changes. |
| Simplicity and YAGNI | PASS | Reuse existing configuration, path helper, workflow and acceptance step structure; no new dependencies or layers. |
| Deterministic Domain Rules | PASS WITH EXISTING CONSTRAINT | No domain rules change. Existing externally configured `HN_CRAWLER_ACCEPTANCE_URL` remains; deterministic local fixture serving is explicitly outside this feature. |

## Design Decisions

### Database path configuration

- `HN_CRAWLER_DB_PATH` is a full path to the SQLite database file.
- When non-empty, it takes precedence over `env-paths`; its parent directory is created using the existing path helper behavior.
- When missing or empty, the current `env-paths('hn-crawler')` path and database filename remain the default.
- Remove or supersede `HN_CRAWLER_TEST_DB_PATH` so there is one documented override contract. Update config/path unit tests accordingly.
- The acceptance test steps will pass the workflow-provided path through to every CLI process they start. Per-scenario temporary paths can continue to be used in local/manual acceptance setup where the step harness owns cleanup.

### Acceptance error contract

- Keep the `error:` prefix assertion for Commander errors.
- The four argument validation failures recorded in `acceptance_tests_results.txt` currently print raw messages from the crawl command. Keep those messages unchanged; assert their appropriate message text and non-zero status. Do not require a Commander prefix for custom validation errors.
- Continue checking non-zero status for expected failures.

### Stale acceptance feature

- Remove `tests/acceptance/features/hello-world.feature` and its associated `tests/acceptance/steps/hello-world.steps.ts` because the current CLI has no Hello World command.
- Retain current crawl and usage black-box scenarios.

### Acceptance workflow isolation

- Add a workflow step before the acceptance run that generates a unique temporary SQLite file path (for example, under the runner temporary directory using a random suffix) and exports it through `GITHUB_ENV` as `HN_CRAWLER_DB_PATH`.
- Ensure the variable is available both to the acceptance test runner and the spawned CLI processes.
- Keep the existing acceptance URL preflight and beta flag mapping unchanged.
- Do not execute acceptance tests in this implementation turn; provide the command and expected setup for the user’s manual run.

## Incremental Review Milestones

1. **DB path override**: Add config precedence for `HN_CRAWLER_DB_PATH` and preserve env-path fallback. Add table-driven config and SQLite path tests, including absent, empty, explicit path, and parent directory creation. Run focused unit tests and typecheck; pause for review.
2. **Acceptance error and stale scenario cleanup**: Make acceptance error assertions consistent with the confirmed CLI error contract, keep non-zero status checks, and remove the Hello World feature and steps. Inspect Gherkin/steps without executing acceptance tests; run lint, format, typecheck, and unit coverage; pause for review.
3. **CI temporary DB path**: Add a step before acceptance execution that generates a unique temporary full file path and exports `HN_CRAWLER_DB_PATH`, preserving URL validation and beta configuration. Validate workflow syntax/configuration by static inspection and run all non-acceptance quality gates plus build; leave acceptance execution to the user.

## Project Structure

```text
src/config/config.ts
src/infrastructure/persistence/sqlite/sqlite-path.ts
tests/unit/config/config.test.ts
tests/unit/infrastructure/persistence/sqlite/sqlite-path.test.ts
tests/acceptance/features/crawl.feature
tests/acceptance/features/usage.feature
tests/acceptance/steps/crawl.steps.ts
tests/acceptance/steps/usage.steps.ts
tests/acceptance/features/hello-world.feature       # remove as obsolete
tests/acceptance/steps/hello-world.steps.ts           # remove as obsolete
.github/workflows/acceptance-tests.yml
```

**Structure Decision**: This is a single existing TypeScript CLI project. Changes stay in configuration/SQLite path infrastructure, acceptance scenarios and steps, and the GitHub Actions acceptance workflow. No application/domain behavior or dependencies are added.

## Complexity Tracking

No constitution violations or additional abstractions are proposed.
