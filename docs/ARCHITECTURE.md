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
- **Long titles:** more than 5 words, ordered by comments (descending).
- **Short titles:** 5 words or fewer, ordered by points (descending).
- Ties keep the original Hacker News rank. Missing points or comments (e.g. job posts) count as 0.
- **Usage record:** timestamp, applied filter, source URL, entries scraped, entries returned, duration and outcome (success, or error with message).

## Scaffolding

```text
hn-web-crawler/
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

| Folder                              | Responsibility                                                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain`                        | Pure core: entities and value objects (`HNEntry`, `FilterType`, `UsageRecord`) and stateless text utilities (`countWords`, `extractNumber`). No external dependencies; unaware of streams, HTTP, databases or the CLI. |
| `src/application`                   | The main use case (`crawl-hn`): reads entries from a port, applies a pipeline, records usage.                                                                                                                          |
| `src/application/ports`             | Driven interfaces that decouple orchestration from I/O: the entry source (sync or async iterable of entries) and the usage repository.                                                                                 |
| `src/application/pipeline`          | Generic stream building blocks: `pipe`/`pipeAsync` and operators (`filter`, `map`, `take`, `eagerTopK`), plus their type declarations.                                                                                 |
| `src/application/pipeline/steps`    | Single-responsibility steps configured with domain rules: lazy filters (`filter-*`) and bounded eager windows (`top-by-*`).                                                                                            |
| `src/application/pipeline/composed` | Pre-wired pipelines (`long-titles`, `short-titles`) combining steps into business flows.                                                                                                                               |
| `src/infrastructure/web`            | HTTP fetching, lazy HTML-to-entry parsing with Cheerio, and the adapter implementing the entry-source port.                                                                                                            |
| `src/infrastructure/persistence`    | Usage repository implementation on SQLite.                                                                                                                                                                             |
| `src/presentation`                  | Driving adapter: `cli.ts` handles argument parsing and output formatting; `main.ts` is the composition root where concrete adapters are instantiated and injected into the use case.                                   |
| `tests/fixtures`                    | Static HTML snapshots shared by all test levels, so no test needs the live site.                                                                                                                                       |
| `tests/unit`                        | Mirrors `src`; see `QA.md`.                                                                                                                                                                                            |
| `tests/acceptance`                  | Gherkin `features` and `steps` exercising the CLI; see `QA.md`.                                                                                                                                                        |
| `docs`                              | Project documentation.                                                                                                                                                                                                 |
| `.github/workflows`, `.husky`       | CI/CD workflows and git hooks; see `CICD.md`.                                                                                                                                                                          |

### Conventions

- Files are kebab-case with a role suffix: `.port.ts`, `.step.ts`, `.pipeline.ts`, `.client.ts`, `.parser.ts`, `.adapter.ts`, `.repo.ts`, `.use-case.ts`.
- Files at the root of a folder are the shared or orchestrating pieces of that folder. Subfolders group files by role.
- Add a nesting level only for a reason, such as a new role or technology.

## Component design decisions

- **Async generators** stream data step by step instead of loading everything in memory.
- **Pure, reusable functions** handle ingestion and processing. A source can be sync or async, and the stream upgrades to async when a step needs it.
- **Pipeline style:** `pipeAsync(source, ...operators)` composes operators; steps and composed pipelines are built from them.
- **Operator typing:** the generic sits on the returned function, so `T` is inferred from the source and call sites need no explicit type. Overloads keep sync input sync and promote anything async.
- **Declaration files:** pipe and operator types live in a dedicated `.d.ts` with a different basename from its implementation (TypeScript ignores a `.d.ts` that shares a `.ts` file's name). It is consumed with `import type`.

```typescript
function take(limit: number): {
  <T>(source: Iterable<T>): Generator<T>;
  <T>(source: AsyncIterable<T> | Iterable<T>): AsyncGenerator<T>;
};
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
