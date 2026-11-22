# Implementation Plan: Introduce Dependency Injection

**Branch**: `014-introduce-dependency-injection` | **Date**: 2026-11-22 | **Spec**: `specs/014-introduce-dependency-injection/spec.md`

**Input**: Feature specification from `/specs/014-introduce-dependency-injection/spec.md`

## Summary

Introduce a Dependency Injection pattern using `inversify` with `@inversifyjs/strongly-typed` (programmatic DI, no decorators) to avoid manually bootstrapping dependencies of classes. The composition root moves from `src/presentation/main.ts` to `src/main.ts`, and a new `src/bootstrap/` folder hosts the DI wiring (`container.ts`, `tokens.ts`, `binding.map.ts`). All classes are bound as singletons. CLI commands are not yet integrated into the container (out of scope). Functional and non-functional behavior is unchanged; no acceptance tests are modified.

## Technical Context

**Language/Version**: TypeScript 5.7.3 (strict), Node 26 LTS

**Primary Dependencies**: `inversify` 8.3.0, `@inversifyjs/strongly-typed` 3.0.1 (DI library, already installed); `axios` 1.21.1, `cheerio` 1.0.0, `commander` 12.1.0, `drizzle-orm` 1.0.0-rc.5, `env-paths` 4.0.0

**Storage**: SQLite via `node:sqlite` (built-in Node driver) with Drizzle ORM schema and migrations

**Testing**: Vitest (unit, 100% coverage), Cucumber/Gherkin (acceptance); composition root excluded from coverage

**Target Platform**: Node 26 LTS CLI executable

**Project Type**: CLI

**Performance Goals**: N/A — internal refactor with no behavior change; performance characteristics unchanged

**Constraints**:

- No breaking changes to CLI contract, output format, exit codes, or error handling
- Programmatic DI only — no decorators on application, domain, or core code
- All classes bound as singletons
- `inversify` DI is used at the application level only — NOT for unit testing
- `src/bootstrap/` folder and `src/main.ts` excluded from unit tests AND unit tests coverage
- CLI commands (root or subcommands) not integrated into the container yet
- Existing acceptance tests must pass with zero modifications
- Composition root moves from `src/presentation/main.ts` to `src/main.ts`
- New `src/bootstrap/` folder introduced for DI wiring

**Scale/Scope**: Internal refactor; affects composition root and DI wiring only; no domain, application, or infrastructure behavior changes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Constitution Principle                                                                                                                                                                                                                                                           | Assessment                                                                                                                                                                                                                                                                                                                                                                                                                    | Status |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **I. Hexagonal Architecture** — Dependency rule `presentation → application → domain`, `infrastructure → application + domain`. Domain imports nothing. Application never imports from infrastructure or presentation. Only the composition root instantiates concrete adapters. | The `src/bootstrap/` folder and `src/main.ts` composition root remain the single place where concrete adapters are instantiated. `inversify` container is created and consumed only at the composition root. Domain and application layers have zero knowledge of `inversify`.                                                                                                                                                | PASS   |
| **II. Test-First** — TDD mandatory; 100% unit coverage; composition root excluded from coverage.                                                                                                                                                                                 | `src/main.ts` (composition root) and `src/bootstrap/` folder excluded from unit tests AND coverage (updating the existing exclusion from `src/presentation/main.ts` to also cover `src/main.ts` and `src/bootstrap/`). `inversify` DI is used at the application level only — NOT for unit testing. No new tests are written for this feature per spec; existing tests validate unchanged behavior. New `src/bootstrap/` modules (`container.ts`, `tokens.ts`, `binding.map.ts`) are pure wiring with no behavior to unit test; they are configuration-level files analogous to the composition root. | PASS   |
| **III. Pipes and Filters** — Pure functions, async generators, side effects only in adapters.                                                                                                                                                                                    | Unaffected; no pipeline, operator, or step changes.                                                                                                                                                                                                                                                                                                                                                                           | PASS   |
| **IV. Simplicity and YAGNI** — No layer/folder/tool without a concrete reason; kebab-case naming with role suffixes.                                                                                                                                                             | `src/bootstrap/` is introduced specifically for DI wiring (concrete reason: the DI feature). File names follow conventions: `container.ts`, `tokens.ts`, `binding.map.ts` (role suffixes). `inversify` is already installed and configured; no new dependency added.                                                                                                                                                          | PASS   |
| **V. Deterministic Domain Rules** — Word count, filters, ranking, ties, missing data, candidate set, usage record.                                                                                                                                                               | Unaffected; no domain rule changes.                                                                                                                                                                                                                                                                                                                                                                                           | PASS   |

**Gate Result**: All constitution principles pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/014-introduce-dependency-injection/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command) — CLI contract unchanged
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── bootstrap/
│   ├── container.ts     # createContainer function — DI container assembly
│   ├── tokens.ts        # Symbol tokens for identifying each container binding
│   └── binding.map.ts   # Binding type definitions for the container
├── domain/
│   ├── entities/hn-entry.entity.ts
│   ├── entities/usage.entity.ts
│   ├── policies/entry-filter.policy.ts
│   └── vo/
│       ├── applied-filters.vo.ts
│       ├── numeric.ts
│       └── title.ts
├── application/
│   ├── mappers/applied-filters.mapper.ts
│   ├── pipeline/
│   │   ├── factory/factory.ts
│   │   ├── operators/
│   │   ├── orchestrator/async.pipe.ts
│   │   └── steps/filter-title-words.step.ts
│   ├── ports/in/
│   ├── ports/out/
│   └── usecases/
│       ├── crawler.usecase.ts
│       ├── usage-query.usecase.ts
│       └── decorators/tracked-crawler.usecase.ts
├── config/config.ts
├── infrastructure/
│   ├── web/
│   │   ├── hn-crawler.parser.ts
│   │   ├── hn-http.client.ts
│   │   ├── hn-web.adapter.ts
│   │   └── axios.ts
│   └── persistence/
│       └── sqlite/
│           ├── repositories/usage.repository.ts
│           ├── schema/usage.schema.ts
│           ├── sqlite-migrator.ts
│           ├── sqlite.client.ts
│           └── migration-files.ts
├── presentation/
│   ├── cli/
│   │   ├── cli.ts
│   │   ├── crawl.ts
│   │   └── usage.ts
│   └── main.ts           # DELETED (moved to src/main.ts)
├── main.ts               # Composition root — moved from src/presentation/main.ts; uses container
└── types/globals.d.ts

tests/
├── unit/                 # mirrors src/
└── acceptance/
    ├── features/
    └── steps/
```

**Structure Decision**: Single project (DEFAULT). The `src/bootstrap/` folder is added at the `src/` root level to host DI wiring, consistent with the constitution's "add a nesting level only for a new role or technology" rule (DI is a new role/technology concern). The composition root moves from `src/presentation/main.ts` to `src/main.ts` at the `src/` root, making it a top-level orchestration entry point. `src/presentation/main.ts` is deleted.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

No violations — section not applicable.

## Documentation Drift Detection

The following documentation drifts are identified and planned as part of this feature. They are listed here for awareness; actual doc edits occur during implementation milestones.

### ARCHITECTURE.md — drift detected

| Location                                           | Current text                                                                                    | Required change                                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Constitution principle I (quoted)                  | "Concrete adapters are instantiated only in the composition root (`src/presentation/main.ts`)." | Update to `src/main.ts`.                                                                                                     |
| Project structure tree (line ~65)                  | `src/presentation/main.ts` — composition root / DI                                              | Replace with `src/main.ts` — composition root / DI; add `src/bootstrap/` with `container.ts`, `tokens.ts`, `binding.map.ts`. |
| Folder responsibilities table (`src/presentation`) | "`main.ts` is the composition root that instantiates concrete adapters and injects use cases."  | Reference `src/main.ts` as the composition root; note `src/bootstrap/` hosts DI wiring.                                      |
| Technologies table                                 | No `inversify` entry                                                                            | Add `inversify` + `@inversifyjs/strongly-typed` as DI library (programmatic, no decorators).                                 |

### QA.md — drift detected

| Location                    | Current text                                 | Required change          |
| --------------------------- | -------------------------------------------- | ------------------------ |
| Coverage section (line ~27) | Coverage excludes `src/presentation/main.ts` | Change to `src/main.ts`. |

### CICD.md — no drift

No references to the composition root location or DI wiring; no changes required.
