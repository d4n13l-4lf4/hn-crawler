# Architecture

> References: `QA.md` (testing and quality gates) · `CICD.md` (branching, workflows and releases)

## Purpose

A standalone CLI that retrieves up to the first 30 Hacker News entries (rank, title, points, comments), optionally filters by title word count, optionally ranks by comments or points, and records crawl usage in SQLite for display through the usage command.

## Principles

- **Hexagonal architecture with light DDD.** Ubiquitous language, entities and value objects. No aggregates or domain events.
- **Pipes and filters.** Data flows through small, independent, composable steps.
- **SOLID and pure functions.** Side effects live only in adapters.
- **Keep it simple.** No layer, folder or tool without a concrete reason.

### Dependency rule

`presentation → application → domain`, and `infrastructure → application (ports) + domain`. The domain imports nothing. The application never imports from infrastructure or presentation. Only the composition root instantiates concrete adapters.

## Domain rules

- **Word count:** whitespace-separated tokens containing at least one letter or digit. `This is - a self-explained example` has 5 words.
- **Title-word filters:** retain titles with more than a configured number of words (`gt`) or at most a configured number (`le`). Filtering is applied only when requested and can be combined with either ranking metric.
- **Ranking:** when requested, sort eligible entries by comments or points in descending order. No ranking is applied by default. Missing selected values count as 0.
- Ties keep the original Hacker News rank.
- **Usage record:** request ID, timestamp, applied operations, and duration. Applied operations are stored as text; `none` represents a crawl with neither filtering nor ranking.

## Project Structure

```text
hn-crawler/
├── src/
│   ├── domain/
│   │   ├── entities/hn-entry.entity.ts
│   │   ├── entities/usage.entity.ts
│   │   ├── policies/entry-filter.policy.ts
│   │   └── vo/
│   │       ├── applied-filters.vo.ts
│   │       ├── numeric.ts
│   │       └── title.ts
│   ├── application/
│   │   ├── mappers/applied-filters.mapper.ts
│   │   ├── pipeline/
│   │   │   ├── factory/factory.ts
│   │   │   ├── operators/
│   │   │   ├── orchestrator/async.pipe.ts
│   │   │   └── steps/filter-title-words.step.ts
│   │   ├── ports/in/
│   │   ├── ports/out/
│   │   └── usecases/
│   ├── config/config.ts
│   ├── infrastructure/
│   │   ├── web/
│   │   └── persistence/
│   │       └── sqlite/
│   │           ├── repositories/usage.repository.ts
│   │           ├── schema/usage.schema.ts
│   │           ├── sqlite-migrator.ts
│   │           └── sqlite.client.ts
│   └── presentation/
│       ├── cli/
│       │   ├── cli.ts
│       │   ├── crawl.ts
│       │   └── usage.ts
│       └── main.ts                 <-- composition root / DI
├── drizzle/
│   └── migrations/
├── tests/
│   ├── resources/                  <-- shared static HTML
│   ├── helpers/
│   ├── unit/                       <-- mirrors src/
│   └── acceptance/
│       ├── features/
│       └── steps/
├── docs/
├── .github/workflows/
├── .husky/
├── .nvmrc
├── .gitignore
├── package.json
├── tsconfig.build.json
├── tsconfig.json
└── README.md
```

The web adapter uses `hn-http.client.ts`, `hn-crawler.parser.ts`, and `hn-web.adapter.ts` under `src/infrastructure/web`. Application ports define crawler, usage-query, entry-source, and usage-repository contracts. Root-level configuration files for the tools in the stack sit next to `package.json`; compiled output goes to an ignored `dist` folder.

### Folder responsibilities

| Folder                                  | Responsibility                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain`                            | Pure core: entities, value objects, and policies such as title-word predicates. No external dependencies; unaware of streams, HTTP, databases or the CLI.                       |
| `src/application`                       | Crawler and usage-query use cases coordinate ports, mapping, and pipeline behavior without depending on infrastructure or presentation.                                         |
| `src/application/ports`                 | Interfaces that decouple the crawler use case from entry-source and pipeline implementations.                                                                                   |
| `src/application/pipeline`              | Async stream building blocks: `pipeAsync`, lazy `filter`, bounded `topK`, configured title filters, and the pipeline factory.                                                   |
| `src/application/pipeline/orchestrator` | Composes asynchronous iterable steps in order.                                                                                                                                  |
| `src/application/pipeline/steps`        | Single-responsibility asynchronous steps configured with domain policies.                                                                                                       |
| `src/application/pipeline/factory`      | Creates a pipeline for the requested ranking and optional title-word filter.                                                                                                    |
| `src/infrastructure/web`                | Native HTTP fetching, lazy HTML-to-entry parsing with Cheerio, and the adapter implementing the entry-source port.                                                              |
| `src/infrastructure/persistence`        | Usage repository, schema, database path, SQLite client, and migration setup. Drizzle ORM accesses the built-in Node SQLite driver.                                              |
| `src/config`                            | Environment-backed runtime configuration, including database path override and usage retention limit.                                                                           |
| `src/presentation`                      | Driving adapter: `cli/cli.ts`, `cli/crawl.ts`, and `cli/usage.ts` define commands; `main.ts` is the composition root that instantiates concrete adapters and injects use cases. |
| `tests/resources`                       | Static HTML snapshot shared by unit tests, so parsing tests do not need the live site.                                                                                          |
| `tests/unit`                            | Mirrors `src`; see `QA.md`.                                                                                                                                                     |
| `tests/acceptance`                      | Gherkin `features` and `steps` exercising the CLI process; see `QA.md`.                                                                                                         |
| `docs`                                  | Project documentation.                                                                                                                                                          |
| `.github/workflows`, `.husky`           | CI/CD workflows and git hooks; see `CICD.md`.                                                                                                                                   |

### Conventions

- Files are kebab-case with a role suffix: `.port.ts`, `.step.ts`, `.pipeline.ts`, `.client.ts`, `.parser.ts`, `.adapter.ts`, `.repo.ts`, `.use-case.ts`.
- Files at the root of a folder are the shared or orchestrating pieces of that folder. Subfolders group files by role.
- Add a nesting level only for a reason, such as a new role or technology.

## Component design decisions

- **Async generators** stream data step by step instead of loading everything in memory.
- **Pure, reusable functions** handle processing. The entry-source port supplies an async iterable, and pipeline operators consume async iterables.
- **Pipeline style:** `pipeAsync(source, ...operators)` composes async operators; a factory wires the requested title filter and optional ranking. With no selected operations, entries pass through without filtering or ranking.
- **Operator typing:** the generic sits on the returned function, so `T` is inferred from the source and call sites need no explicit type.
- **Declaration files:** pipe and operator types live in a dedicated `.d.ts` with a different basename from its implementation (TypeScript ignores a `.d.ts` that shares a `.ts` file's name). It is consumed with `import type`.

```typescript
type AsyncStep<In, Out> = (source: AsyncIterable<In>) => AsyncGenerator<Out>;
```

- **Configurable source:** production crawls use the configured Hacker News URL. The beta-only `--url` option can select another page for acceptance testing.

## Technologies

Testing and delivery tooling is described in `QA.md` and `CICD.md`.

| Technology                                       | Role                                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| TypeScript (strict)                              | Base language; compiled to JavaScript with `tsc`, no bundler                                                      |
| Node 26 LTS + npm                                | Runtime and package manager; `.nvmrc` pins the development version and package metadata requires Node 26 or newer |
| Commander                                        | CLI framework                                                                                                     |
| Native `fetch` + Cheerio                         | HTTP requests and HTML parsing                                                                                    |
| `node:sqlite`                                    | SQLite driver built into Node                                                                                     |
| Drizzle ORM                                      | Typed SQLite schema, queries, and migration execution                                                             |
| Drizzle Kit                                      | Schema-driven migration generation and validation                                                                 |
| `env-paths`                                      | Resolve the operating system's per-user data directory for the default SQLite database                            |
| TypeScript path aliases + `tsc-alias`            | `@/*` source imports are rewritten to runtime paths after compilation                                             |
| Vitest + coverage v8, Cucumber, ESLint, Prettier | Unit and acceptance testing, coverage, linting, and formatting; quality-gate details are in `QA.md`               |
