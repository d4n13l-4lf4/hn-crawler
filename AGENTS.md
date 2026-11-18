# AGENTS.md

A standalone TypeScript CLI that scrapes the first 30 Hacker News entries (number, title, points, comments), applies one of two title-length filters and stores usage data in SQLite.

## Read first

| Document               | Read it for                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `docs/ARCHITECTURE.md` | Layers, dependency rule, folder layout, domain rules, naming conventions, design decisions, technologies |
| `docs/QA.md`           | TDD workflow, test levels and locations, coverage, quality gates, local commands                         |
| `docs/CICD.md`         | Branching, semver and beta versioning, workflows, pre-commit hook                                        |

These documents are the source of truth. If a task conflicts with them, stop and ask instead of working around them.

## Rules that matter most

- **Test first.** Write a failing test, make it pass, then refactor (see `docs/QA.md`).
- **Respect the dependency rule.** The domain imports nothing, and the application never imports from infrastructure or presentation. Concrete adapters are instantiated only in the composition root (see `docs/ARCHITECTURE.md`).
- **Put code where the scaffolding says.** Follow the folder responsibilities and file naming in `docs/ARCHITECTURE.md`. Do not invent new folders or layers without a reason.
- **Pure functions and async generators** for data processing. Side effects only in adapters.
- **Keep it simple.** Do not add tools, dependencies or abstractions the documents do not call for.

## Before you finish a change

Run the quality gates, which must all pass (formatting, linting, type checking, tests with 100% coverage). The exact scripts are in `docs/QA.md`. The same gates run in the pre-commit hook and in CI.

## Git workflow

Work on a `feature/**` branch, merged into a `release/**` branch by PR. Make small, incremental changes that each leave the gates green. Details are in `docs/CICD.md`.
