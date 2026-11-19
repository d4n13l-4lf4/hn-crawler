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
- Ports are faked in use-case tests. Parser and adapter unit tests use the static HTML resource in `tests/resources/hacker-news.html`; tests do not need to access the live site.
- Acceptance tests use the externally configured `HN_CRAWLER_ACCEPTANCE_URL` and the beta-only `--url` option. The URL must provide a deterministic page; the test steps do not start a local fixture server.
- Acceptance tests require `HN_CRAWLER_ACCEPTANCE_URL` and `HN_CRAWLER_BETA=true`. Usage scenarios use a temporary database path through `HN_CRAWLER_DB_PATH`. In CI, acceptance runs after successful beta publication against the installed beta package.

## Coverage

Vitest uses the V8 coverage provider and enforces 100% per-file and aggregate coverage for statements, branches, functions, and lines. Coverage excludes `src/presentation/main.ts`, declaration files, port files, and `*.type.ts` files.

## Quality gates

The pre-commit hook runs `npm run quality`. Acceptance tests run separately and are not part of that hook or the aggregate quality script. The CI workflow runs `npm run quality` for pull requests.

| #   | Gate                      | Tool                             |
| --- | ------------------------- | -------------------------------- |
| 1   | Code formatting           | Prettier (check mode)            |
| 2   | Linting                   | ESLint                           |
| 3   | Type checking             | TypeScript compiler without emit |
| 4   | Tests and coverage (100%) | Vitest + coverage v8             |

## Local commands

- `npm run test:unit` — run unit tests without coverage.
- `npm run test:coverage` — run unit tests with coverage thresholds.
- `npm run test:acceptance` — run Cucumber against the configured acceptance URL.
- `npm run test:acceptance:local` — build and install the local package, then run acceptance tests.
- `npm run quality` — run formatting, format check, lint, typecheck, and unit tests with coverage.
