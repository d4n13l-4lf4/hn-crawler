# Implementation Plan: Base Project Scaffolding

**Branch**: `001-base-project-scaffolding` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-base-project-scaffolding/spec.md`

## Summary

Create the complete project scaffolding for the HN Crawler CLI tool with a minimal "Hello World" command. This includes: hexagonal architecture folder structure, TypeScript/Node.js project configuration, Commander-based CLI with a default hello world command, unit tests (Vitest) and acceptance tests (Cucumber), Husky pre-commit hooks running all four quality gates (format, lint, typecheck, test+coverage), and GitHub Actions CI/CD workflows (ci, beta-release, acceptance-tests, release) for beta version publishing. Beta publishing runs after a PR to `release/**` is closed and merged; production publishing runs after a PR to `main` is merged. No manual GitHub ruleset configuration or git commit is part of this feature's implementation scope. The real scraping functionality will be implemented in subsequent stories.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) / Node 26 LTS (pinned in `.nvmrc`)

**Primary Dependencies**:

- `commander` — CLI framework
- `cheerio` — HTML parsing (for future scraping)
- `vitest` — Unit testing and coverage
- `@cucumber/cucumber` — Acceptance testing (Gherkin)
- `prettier` — Code formatting
- `eslint` — Linting
- `husky` — Git hooks
- `typescript` — Compiler
- `@types/node` — Node types

**Vitest Configuration**: `vitest.config.mts` — Vitest's configuration file for this project. This supersedes task T042's `.ts` filename.

**Storage**: N/A for this story (SQLite via `node:sqlite` for future usage persistence)

**Testing**:

- Unit: Vitest tests target included implementation behavior and maintain 100% coverage, excluding the composition root. Do not add tests that inspect quality-gate configuration, repository structure, or workflow YAML; validate those through the configured scripts, project checks, and CI execution.
- Acceptance: Cucumber/Gherkin via `npm run test:acceptance` against the already-installed, exact published beta in CI; use `npm run test:acceptance:local` for local validation, which builds and installs the working tree package before running the same scenarios. Do not use `test:acceptance` as the local validation command.

**Target Platform**: Cross-platform CLI (Linux, macOS, Windows) via Node.js

**Project Type**: CLI tool (npm package)

**Performance Goals**: CLI startup < 500ms (SC-001); CI workflow < 5 minutes (SC-003)

**Constraints**:

- Implement only the Hello World CLI, project scaffold, automated quality gates, and release workflows described by the feature specification. Defer real scraping, title filtering, stream operators, and usage persistence to later features.
- 100% unit-test coverage (excluding `src/presentation/main.ts`)
- No bundler — compile with `tsc` only
- Hexagonal architecture with strict dependency rule
- Pure functions in domain/application; side effects only in infrastructure adapters
- Pre-commit hook must run all 4 quality gates
- `beta-release` runs only when a PR to `release/**` is closed and merged; `release` runs after a PR to `main` is merged
- No repository ruleset configuration or initial git commit is required as part of this feature

**Scale/Scope**: Single CLI command (`hn-crawler`) with hello world output; full folder structure for hexagonal architecture; 4 GitHub Actions workflows; ~20 source files for scaffolding

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                         | Status     | Notes                                                                                                                       |
| ------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| I. Hexagonal Architecture with Light DDD          | ✅ Aligned | Plan creates exact folder structure from ARCHITECTURE.md                                                                    |
| II. Test-First Development (NON-NEGOTIABLE)       | ✅ Aligned | Plan includes unit and acceptance test setup                                                                                |
| III. Pipes and Filters with Pure Functions        | ✅ Aligned | The scaffold preserves this architecture for future stories; implementing pipeline behavior is outside this feature's scope |
| IV. Simplicity and YAGNI                          | ✅ Aligned | Minimal hello world; no extra abstractions                                                                                  |
| V. Deterministic Domain Rules                     | ✅ Aligned | Domain rules documented; not implemented yet                                                                                |
| Architecture & Domain Rules (ref ARCHITECTURE.md) | ✅ Aligned | Folder structure, naming conventions, tech stack match                                                                      |
| Quality Gates & Testing (ref QUALITY.md)          | ✅ Aligned | 4 gates, 100% unit coverage, unit and acceptance test levels, TDD                                                           |
| CI/CD Workflow (ref CICD.md)                      | ✅ Aligned | 4 workflows, gitflow, beta versioning                                                                                       |
| Governance                                        | ✅ Aligned | Version 1.0.0; amendment procedure documented                                                                               |

**No violations** — all constitutional principles are satisfied by this plan.

## Project Structure

### Documentation (this feature)

```text
specs/001-base-project-scaffolding/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CLI command schema)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
hn-crawler/
├── src/
│   ├── domain/
│   │   ├── models.ts
│   │   └── text-utils.ts
│   ├── application/
│   │   ├── ports/
│   │   │   ├── entry-source.port.ts
│   │   │   └── usage-repo.port.ts
│   │   ├── pipeline/
│   │   │   ├── pipe.ts
│   │   │   ├── operators.ts
│   │   │   ├── pipeline.types.d.ts
│   │   │   ├── steps/
│   │   │   │   ├── filter-more-than-five-words.step.ts
│   │   │   │   ├── filter-up-to-five-words.step.ts
│   │   │   │   ├── top-by-comments.step.ts
│   │   │   │   └── top-by-points.step.ts
│   │   │   └── composed/
│   │   │       ├── long-titles.pipeline.ts
│   │   │       └── short-titles.pipeline.ts
│   │   └── crawl-hn.use-case.ts
│   ├── infrastructure/
│   │   ├── web/
│   │   │   ├── hn-http.client.ts
│   │   │   ├── hn-cheerio.parser.ts
│   │   │   └── hn-web.adapter.ts
│   │   └── persistence/
│   │       └── sqlite-usage.repo.ts
│   └── presentation/
│       ├── cli.ts
│       └── main.ts                 # Composition root / DI
├── tests/
│   ├── fixtures/
│   ├── unit/                       # Mirrors src/
│   └── acceptance/
│       ├── features/
│       └── steps/
├── docs/
├── .github/workflows/
├── .husky/
├── .nvmrc
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

**Structure Decision**: The exact hexagonal architecture structure from ARCHITECTURE.md is used (Option 1: Single project). Unit tests cover included behavior and acceptance tests cover the CLI end to end. Integration testing is outside this feature's scope.

## Complexity Tracking

> No constitutional violations — all gates pass. This section not needed.

---

## Phase 0: Research

All technical choices are mandated by the constitution and architecture docs. No NEEDS CLARIFICATION items remain. Research documents best practices for the prescribed stack.

### Research Tasks

1. **Vitest 100% coverage configuration** — How to exclude composition root (`main.ts`) from coverage while requiring 100% elsewhere
2. **Cucumber acceptance test setup** — Keep the CI command for the exact published beta separate from the local command that builds and installs the working tree package, per CICD.md
3. **GitHub Actions beta versioning** — Deriving `<version>-beta.sha<short-SHA>` from git commit
4. **Husky pre-commit with multiple gates** — Running format, lint, typecheck, test sequentially and failing fast
5. **TypeScript strict config for hexagonal architecture** — Path aliases, module resolution, declaration maps

### Research Output → `research.md`

See [research.md](research.md) for consolidated findings.

---

## Phase 1: Design & Contracts

### Data Model → `data-model.md`

See [data-model.md](data-model.md) for the minimal entities needed for scaffolding (CLI command structure, quality gate results, beta release metadata).

### Contracts → `contracts/`

See [contracts/cli-command.md](contracts/cli-command.md) for the Commander command schema (name, version, description, default action, help).

### Quickstart Validation Guide → `quickstart.md`

See [quickstart.md](quickstart.md) for runnable validation steps: clone → install → build → run CLI → run quality gates → run acceptance tests.

---

## Phase 1 Design Artifacts Generated

- ✅ `research.md` — Best practices for prescribed stack
- ✅ `data-model.md` — Minimal entities for scaffolding
- ✅ `contracts/cli-command.md` — CLI interface contract
- ✅ `quickstart.md` — End-to-end validation guide

## Constitution Check (Post-Design Re-evaluation)

All principles remain aligned. No new violations introduced by design decisions.

---

**Ready for Phase 2**: Run `/speckit.tasks` to generate the task breakdown for implementation.
