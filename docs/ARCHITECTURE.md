# Architecture

> References: `QA.md` (testing and quality gates) · `CICD.md` (branching, workflows and releases)

## Purpose

A standalone CLI that scrapes the first 30 entries of Hacker News (number, title, points, comments), applies one of two filters and records every run as usage data.

## Principles

- **Hexagonal architecture with light DDD.** Ubiquitous language, entities and value objects. No aggregates or domain events.
- **Pipes and filters.** Data flows through small, independent, composable steps.
- **SOLID and pure functions.** Side effects live only in adapters.
- **Keep it simple.** No layer, folder or tool without a concrete reason.

### Dependency rule

`presentation → application → domain`, and `infrastructure → application (ports) + domain`. The domain imports nothing. The application never imports from infrastructure or presentation. Only the composition root instantiates concrete adapters.

## Domain rules

- **Word count:** whitespace-separated tokens containing at least one letter or digit. `This is - a self-explained example` has 5 words.
- **Title-word filters:** retain titles with more than a configured number of words (`gt`) or at most a configured number (`le`). The CLI defaults to more than five words; either filter can be combined with either ranking metric.
- **Ranking:** sort eligible entries by comments or points in descending order. Comments are the default ranking metric. Missing selected values count as 0.
- Ties keep the original Hacker News rank.
- **Usage record:** timestamp, applied filter, source URL, entries scraped, entries returned, duration and outcome (success, or error with message).

## Scaffolding

```text
hn-web-crawler/
├── src/
│   ├── domain/
│   │   ├── entities/hn-entry.entity.ts
│   │   ├── policies/entry-filter.policy.ts
│   │   └── vo/
│   ├── application/
│   │   ├── ports/
│   │   │   ├── in/crawler.port.ts
│   │   │   └── out/entry-source.port.ts
│   │   ├── pipeline/
│   │   │   ├── pipeline.types.d.ts
│   │   │   ├── orchestrator/async.pipe.ts
│   │   │   ├── operators/filter.ts
│   │   │   ├── operators/top-k.ts
│   │   │   ├── steps/filter-title-words.step.ts
│   │   │   └── factory/factory.ts
│   │   └── usecases/crawler.usecase.ts
│   ├── infrastructure/
│   │   ├── web/
│   │   │   ├── hn-http.client.ts
│   │   │   ├── hn-cheerio.parser.ts
│   │   │   └── hn-web.adapter.ts
│   │   └── persistence/
│   │       └── sqlite-usage.repo.ts
│   └── presentation/
│       ├── cli/
│       │   └── crawl.ts
│       └── main.ts                 <-- composition root / DI
├── tests/
│   ├── fixtures/
│   ├── unit/                       <-- mirrors src/
│   ├── integration/
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

Root-level configuration files for the tools in the stack (linter, formatter, test runners) sit next to `package.json`. Compiled output goes to an ignored `dist` folder.

### Folder responsibilities

| Folder                                  | Responsibility                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/domain`                            | Pure core: entities, value objects, and policies such as title-word predicates. No external dependencies; unaware of streams, HTTP, databases or the CLI.                            |
| `src/application`                       | The crawler use case reads entries from a port, requests a configured pipeline through an application-owned contract, and applies it.                                                |
| `src/application/ports`                 | Interfaces that decouple the crawler use case from entry-source and pipeline implementations.                                                                                        |
| `src/application/pipeline`              | Async stream building blocks: `pipeAsync`, lazy `filter`, bounded `topK`, configured title filters, and the pipeline factory.                                                        |
| `src/application/pipeline/orchestrator` | Composes asynchronous iterable steps in order.                                                                                                                                       |
| `src/application/pipeline/steps`        | Single-responsibility asynchronous steps configured with domain policies.                                                                                                            |
| `src/application/pipeline/factory`      | Creates a pipeline for the requested ranking and optional title-word filter.                                                                                                         |
| `src/infrastructure/web`                | HTTP fetching, lazy HTML-to-entry parsing with Cheerio, and the adapter implementing the entry-source port.                                                                          |
| `src/infrastructure/persistence`        | Usage repository implementation on SQLite.                                                                                                                                           |
| `src/presentation`                      | Driving adapter: `cli.ts` handles argument parsing and output formatting; `main.ts` is the composition root where concrete adapters are instantiated and injected into the use case. |
| `tests/fixtures`                        | Static HTML snapshots shared by all test levels, so no test needs the live site.                                                                                                     |
| `tests/unit`                            | Mirrors `src`; see `QA.md`.                                                                                                                                                          |
| `tests/acceptance`                      | Gherkin `features` and `steps` exercising the CLI; see `QA.md`.                                                                                                                      |
| `docs`                                  | Project documentation.                                                                                                                                                               |
| `.github/workflows`, `.husky`           | CI/CD workflows and git hooks; see `CICD.md`.                                                                                                                                        |

### Conventions

- Files are kebab-case with a role suffix: `.port.ts`, `.step.ts`, `.pipeline.ts`, `.client.ts`, `.parser.ts`, `.adapter.ts`, `.repo.ts`, `.use-case.ts`.
- Files at the root of a folder are the shared or orchestrating pieces of that folder. Subfolders group files by role.
- Add a nesting level only for a reason, such as a new role or technology.

## Component design decisions

- **Async generators** stream data step by step instead of loading everything in memory.
- **Pure, reusable functions** handle processing. The entry-source port supplies an async iterable, and pipeline operators consume async iterables.
- **Pipeline style:** `pipeAsync(source, ...operators)` composes async operators; a factory wires policy steps with the selected ranking.
- **Operator typing:** the generic sits on the returned function, so `T` is inferred from the source and call sites need no explicit type.
- **Declaration files:** pipe and operator types live in a dedicated `.d.ts` with a different basename from its implementation (TypeScript ignores a `.d.ts` that shares a `.ts` file's name). It is consumed with `import type`.

```typescript
type AsyncStep<In, Out> = (source: AsyncIterable<In>) => AsyncGenerator<Out>;
```

- **Configurable source:** the scrape subcommand takes the page URL as a parameter (default: Hacker News), so the same CLI can run against fixtures.

## Technologies

Testing and delivery tooling is described in `QA.md` and `CICD.md`.

| Technology               | Role                                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript (strict)      | Base language; compiled to JavaScript with `tsc`, no bundler                                                                                                                                                              |
| Node 26 LTS + npm        | Runtime and package manager; `.nvmrc` pins the version                                                                                                                                                                    |
| Commander                | CLI framework                                                                                                                                                                                                             |
| Native `fetch` + Cheerio | HTTP requests and HTML parsing                                                                                                                                                                                            |
| `node:sqlite`            | Usage storage in a local file. Built into Node, so there is no native dependency to install. At the time of writing it is marked as a release candidate in Node 26, so it is the one API to re-check when upgrading Node. |
