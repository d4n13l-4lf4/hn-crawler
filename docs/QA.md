# QA Approach

> References: `ARCHITECTURE.md` (folder layout and layers) · `CICD.md` (where the quality gates and acceptance tests run)

## Strategy

- **TDD.** Every implementation starts with a failing test, then goes green, then is refactored.
- **Two automated levels:** unit tests for behaviour in isolation and acceptance tests for the CLI as a user sees it. Acceptance tests cover all main use cases.
- **Manual testing** complements automation: an exploratory smoke run against live Hacker News before a release. It is not part of CI.

## Test levels

| Level      | Tool               | Location                                 | Scope                                                                                                                                                          |
| ---------- | ------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit       | Vitest             | `tests/unit`, mirroring `src`            | Domain utilities, pipeline operators, steps and composed pipelines, parser, adapters, CLI. Each source file has a matching `.test.ts` unless stated otherwise. |
| Acceptance | Cucumber (Gherkin) | `tests/acceptance` (`features`, `steps`) | The CLI executable run as a process. Locally it is the compiled build; in CI it is the published beta package (see `CICD.md`).                                 |

### Conventions

- Unit tests are table-driven and titled with the `it should ...` syntax.
- Ports are faked in use-case tests. Network access is never used: the parser and adapters run against the static HTML in `tests/fixtures`.
- Acceptance tests point the CLI at a fixture page served locally through the scrape subcommand's URL parameter, so results are deterministic and independent of the live site.

## Coverage

100% (Vitest coverage v8) across unit tests, excluding the composition root (`src/presentation/main.ts`).

## Quality gates

Every gate must pass before a commit (pre-commit hook) and before a PR can merge (`ci` workflow).

| #   | Gate                      | Tool                             |
| --- | ------------------------- | -------------------------------- |
| 1   | Code formatting           | Prettier (check mode)            |
| 2   | Linting                   | ESLint                           |
| 3   | Type checking             | TypeScript compiler without emit |
| 4   | Tests and coverage (100%) | Vitest + coverage v8             |

## Local commands

`package.json` exposes one script per gate (`format:check`, `lint`, `typecheck`, `test:coverage`), one for acceptance tests (`test:acceptance`) and one aggregate (`quality`) that runs all gates.
