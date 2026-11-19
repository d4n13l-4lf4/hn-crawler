# Implementation Plan: CLI Usage and Filter Defaults

**Branch**: `008-cli-usage-filter-defaults` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-cli-usage-filter-defaults/spec.md`

## Summary

The acceptance scenarios and step definitions for the new behavior are already refactored. Remaining implementation is divided into two green milestones. First, deliver complete crawl option behavior and matching usage recording/display together: no options preserves first-30 source order and records `none`; filter-only preserves source order; ranking-only ranks all retrieved entries; combined applies filter then ranking; applied descriptions use `sort:` for ranking and `filter:` for title rules. This vertical slice includes CLI normalization, application pipeline/request, usage value mapping, and SQLite round-trip if needed so the aggregate quality gate passes before review. Second, source the CLI version from package metadata and verify it with unit tests only. The user runs acceptance manually after implementation review; do not run Cucumber. Unit tests are test-first, table-driven, and use `it should when` wording.

## Technical Context

**Language/Version**: TypeScript strict mode; Node 26 LTS

**Primary Dependencies**: Commander and existing project dependencies only

**Storage**: Existing SQLite usage store; applied descriptions remain text, so no schema change is expected

**Testing**: Vitest unit tests with 100% coverage; Cucumber acceptance was refactored in milestone 1 and is intentionally not run by the agent

**Target Platform**: Node.js CLI

**Project Type**: Standalone CLI

**Performance Goals**: Retrieve no more than the first 30 entries; process only that bounded candidate set

**Constraints**: Respect hexagonal dependency direction; every implementation review milestone must finish with `npm run quality` passing; acceptance is run manually by the user after implementation; version has no acceptance scenario

**Scale/Scope**: Crawl operation selection, usage description persistence/display, and package version reporting; no new dependencies, layers, or usage schema fields

## Constitution Check

- **Hexagonal architecture**: Pass. CLI parsing remains presentation, the use case and pipeline remain application, applied-filter value semantics remain domain, and SQLite remains infrastructure.
- **Test-first development**: Pass. For each implementation milestone, add/adjust unit tests first, confirm the relevant new tests fail, implement behavior, then run `npm run quality` before review. Acceptance files were authored first and intentionally not run; user execution remains deferred to the end.
- **Pipes and filters**: Pass. Apply only selected filter and ranking operators; absent operations preserve source order.
- **Simplicity / YAGNI**: Pass. Keep existing adapters and text storage; do not add abstractions, dependencies, or schema migrations without evidence they are needed.
- **Deterministic domain rules**: Pass. The spec defines source order, ranking ties, missing metric behavior, and the first-30 candidate set.

No constitution violations identified.

## Project Structure

### Documentation

```text
specs/008-cli-usage-filter-defaults/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli-command.md
└── tasks.md
```

### Source Code

```text
src/
├── application/
│   ├── mappers/applied-filters.mapper.ts
│   ├── pipeline/factory/factory.ts
│   ├── ports/in/crawler.port.ts
│   ├── usecases/crawler.usecase.ts
│   └── usecases/decorators/tracked-crawler.usecase.ts
├── domain/vo/applied-filters.vo.ts
├── infrastructure/persistence/sqlite/repositories/usage.repository.ts
└── presentation/cli/{cli,crawl}.ts

tests/
├── acceptance/features/{crawl,usage}.feature
├── acceptance/steps/{crawl,usage}.steps.ts
└── unit/                         # Mirrors affected source modules
```

**Structure Decision**: Use existing modules. Do not add a new layer or folder. Acceptance changes already exist. Remaining crawl and usage code is one vertical slice because splitting these changes leaves behavior mismatched and causes the quality gate to fail.

## Incremental Delivery and Review Milestones

### Completed milestone 1: Acceptance refactor

The crawl/usage acceptance features and step definitions were updated first. They may fail against the current implementation by design. Cucumber was not run. This milestone is complete and recorded in tasks T001–T005.

### Remaining milestone 2: Complete crawl and usage behavior together

This milestone must land all interdependent behavior before review. Start with table-driven unit tests and verify the new expectations fail. Implement optional ranking/filter request choices; no-option and filter-only paths preserve source order; ranking-only ranks all first-30 candidates; combined mode filters then ranks. In the same milestone, make usage mapping represent no operations as `none`, preserve existing ranking labels, change title labels to `filter:title_words`, and verify display/persistence. Remove tests and implementation assumptions made obsolete by the changed defaults. Finish by running the full `npm run quality` aggregate gate. Do not present the milestone while any part of that gate fails.

### Remaining milestone 3: Dynamic package version

Add table-driven unit coverage for `createCli` that verifies version output follows the package metadata, then update the CLI version registration to use that metadata. Do not add or run an acceptance scenario for version behavior. Run `npm run quality` and present only when it passes.

### Final user-run acceptance

After both implementation milestones have been reviewed and approved, the user runs the acceptance suite with the configured deterministic URL. The agent does not execute Cucumber. Any user-reported failure becomes a focused follow-up milestone that must leave `npm run quality` green.

## Complexity Tracking

No additional architecture or constitution exceptions are required.
