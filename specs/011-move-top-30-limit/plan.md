# Implementation Plan: Move Top-30 Limit to HN Adapter

**Branch**: `011-move-top-30-limit` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-move-top-30-limit/spec.md`

## Summary

Move the responsibility for limiting crawl output to the top 30 stories from the crawl use case (`src/application/usecases/crawler.usecase.ts`) to the HN web adapter (`src/infrastructure/web/hn-web.adapter.ts`). The adapter gains a `maxEntries` argument on its entry-exposing function and paginates the Hacker News site page by page (1 to `MAX_PAGES_TO_FETCH`, default 10) until it has collected the requested number of entries or a page has no entries. Two new config values control the limits: `MAX_ENTRIES_TO_FETCH` (default 30) and `MAX_PAGES_TO_FETCH` (default 10), both using the `HN_CRAWLER_` env-var prefix. The use case no longer imposes any entry-count limit; it calls the adapter with the configured maximum. Functional behavior and all existing acceptance scenarios are unchanged; no acceptance tests are added, modified, or automatically run. Delivery is incremental: each milestone leaves `npm run quality` green and is presented for review before the next begins.

## Technical Context

**Language/Version**: TypeScript strict mode; Node 26 LTS

**Primary Dependencies**: axios (already installed, `^1.21.1`); cheerio, commander, drizzle-orm, env-paths, @libsql/client (existing); vitest + cucumber (testing, existing)

**Storage**: N/A — no storage or schema change

**Testing**: Vitest unit tests with 100% coverage (statements, branches, functions, lines per file and aggregate); Cucumber acceptance intentionally not implemented or run for this feature; acceptance tests are not modified (no functional change)

**Target Platform**: Node.js CLI

**Project Type**: Standalone CLI

**Performance Goals**: HTTP page fetches bounded by `MAX_PAGES_TO_FETCH` (default 10); entry collection bounded by `MAX_ENTRIES_TO_FETCH` (default 30); efficient single `for` loop over pages

**Constraints**:

- Hexagonal dependency direction (`presentation → application → domain`, `infrastructure → application (ports) + domain`); domain imports nothing; application never imports from infrastructure/presentation; concrete adapters instantiated only in the composition root (`src/presentation/main.ts`)
- No user-facing behavior change: same CLI command, same output fields, same ordering, same error handling, same exit codes
- Existing acceptance scenarios pass unmodified (zero test edits)
- Env-var prefix is `HN_CRAWLER_` (e.g., `HN_CRAWLER_MAX_ENTRIES_TO_FETCH`, `HN_CRAWLER_MAX_PAGES_TO_FETCH`)
- Every implementation milestone must finish with `npm run quality` passing (format, lint, typecheck, test+coverage)
- Acceptance is deferred to the user; the agent does not execute Cucumber
- No new layers, folders, or dependencies; file naming keeps kebab-case role-suffix convention

**Scale/Scope**: Source files touched: `src/config/config.ts` (add two limits), `src/application/ports/in/crawler.port.ts` (`CrawlRequest` drops `url`, gains `maxEntries`), `src/application/ports/out/entry-source.port.ts` (`fetchEntries(maxEntries)` — no `url`, bound to axios at startup), `src/application/usecases/crawler.usecase.ts` (remove 30-entry cap; call `fetchEntries(request.maxEntries)`, no count cap in use case), `src/infrastructure/web/hn-web.adapter.ts` (`fetchEntries(maxEntries)` — no `url`; paginate pages 1..K using the axios-bound base URL; yield up to `maxEntries`), `src/presentation/cli/crawl.ts` (build `CrawlRequest` with `maxEntries: config.maxEntriesToFetch`), `src/presentation/main.ts` (wire `config.maxPagesToFetch` into the adapter). Tests mirror affected source modules under `tests/unit/`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Hexagonal architecture**: Pass. `CrawlRequest` (application port) drops `url` (bound to axios at startup) and gains `maxEntries`; `EntrySourcePort.fetchEntries(maxEntries)` remains an application-layer interface. `HnWebAdapter` (infrastructure) implements it and performs pagination/side effects using the axios-bound base URL. `CrawlerUseCase` (application) orchestrates without imposing a count limit, reading `maxEntries` from the request. Domain entities and policies untouched. Concrete adapters instantiated only in `src/presentation/main.ts`.
- **Test-first development**: Pass. For each milestone, add/adjust unit tests first, confirm new tests fail, implement behavior, then run `npm run quality` before review. Acceptance tests are not implemented or run for this feature per the spec.
- **Pipes and filters**: Pass. Pipeline operators (`filter`, `topK`, `pipeAsync`) are unchanged. The use case still pipes adapter-yielded entries through the pipeline for filtering/ranking; only the entry-count limit moves out of the use case.
- **Simplicity / YAGNI**: Pass. No new layers, folders, or dependencies. Two config additions and an adapter refactor; the use case loses logic (simplifies).
- **Deterministic domain rules**: Pass. The domain rule "retrieve up to the first 30 entries, then filter and rank only those entries; return no more than 30" is preserved — the candidate-set limit is now enforced in the adapter (via `maxEntries`) instead of the use case.

No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/011-move-top-30-limit/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── config.ts                 # Updated: adds maxEntriesToFetch, maxPagesToFetch
├── application/
│   ├── ports/in/
│   │   └── crawler.port.ts       # Updated: CrawlRequest drops url, gains maxEntries
│   └── ports/out/
│       └── entry-source.port.ts  # Updated: fetchEntries(maxEntries) — no url (bound to axios)
│   └── usecases/
│       └── crawler.usecase.ts    # Updated: remove 30-entry cap; call fetchEntries(request.maxEntries)
├── infrastructure/
│   └── web/
│       └── hn-web.adapter.ts     # Refactored: fetchEntries(maxEntries), paginate pages 1..K via bound base URL
└── presentation/
    ├── cli/crawl.ts              # Updated: build CrawlRequest with maxEntries: config.maxEntriesToFetch
    └── main.ts                   # Updated: wire config.maxPagesToFetch into the adapter

tests/
└── unit/
    ├── config/config.test.ts                # Updated: new limit cases
    ├── application/usecases/crawler.usecase.test.ts  # Updated: no-limit behavior
    └── infrastructure/web/hn-web.adapter.test.ts     # Updated: pagination + maxEntries
```

**Structure Decision**: Single project (DEFAULT). Use existing modules only; do not add a new layer or folder. Tests mirror affected source modules under `tests/unit/`. No contracts folder is created because the CLI command contract (options, output fields, exit codes) is unchanged by this refactor (consistent with spec 010).

## Incremental Delivery and Review Milestones

### Milestone 1: Configuration — add `MAX_ENTRIES_TO_FETCH` and `MAX_PAGES_TO_FETCH`

- Add `maxEntriesToFetch` (env `HN_CRAWLER_MAX_ENTRIES_TO_FETCH`, default 30) and `maxPagesToFetch` (env `HN_CRAWLER_MAX_PAGES_TO_FETCH`, default 10) to `src/config/config.ts`, with validation (positive integers) matching the existing config style.
- Add table-driven unit tests for the new config cases (defaults, overrides, invalid values).
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; config exposes both limits; no acceptance tests run. Presented for review before Milestone 2.

### Milestone 2: Port + use case — remove limiting behavior from the crawl use case

- Update `CrawlRequest` (`crawler.port.ts`): drop `url` (bound to axios at startup), add `maxEntries: number`.
- Update `EntrySourcePort.fetchEntries(maxEntries: number)` (`entry-source.port.ts`): no `url` argument; the page URL is bound to the axios instance at startup.
- Remove the `if (entries.length === 30) break` limiting block from `CrawlerUseCase.execute()`.
- `CrawlerUseCase` calls `this.entrySource.fetchEntries(request.maxEntries)` and pipes every yielded entry through the pipeline (no count cap in the use case).
- `CrawlerUseCase` no longer receives `maxEntriesToFetch` in its constructor (it comes from `request.maxEntries`).
- Refactor `crawler.usecase.test.ts` (test-first): remove/adapt the "limit to first 30" test; confirm the use case passes all source entries to the pipeline and calls `fetchEntries(request.maxEntries)`.
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; use case imposes no entry-count limit; `CrawlRequest` carries `maxEntries` and has no `url`; adapter is called with `maxEntries`; no acceptance tests run. Presented for review before Milestone 3.

### Milestone 3: HN adapter — paginate pages 1..K and cap at `maxEntries`

- Refactor `HnWebAdapter.fetchEntries(maxEntries: number)`:
  - No `url` argument; the page-1 URL is bound to the axios instance at startup (`baseURL` = configured Hacker News URL).
  - Efficient `for` loop over pages 1 to `maxPagesToFetch` (constructor-injected from config).
  - Page 1 = empty path (resolves to the axios-bound base URL); page N = `?p=N` (or `&p=N` when a query string is already present).
  - After fetching a page, build the parser (POM) for that page.
  - If the parser reports no entries (`hasEntries()` false), break the page loop.
  - If entries exist, yield them.
  - Stop (return) once the yielded count reaches `maxEntries`, breaking the page loop.
- Delete now-obsolete code (the use-case limit already removed; any imports/helpers that become unused).
- Refactor `hn-web.adapter.test.ts` (test-first): table-driven cases for pagination start/stop, `hasEntries()` break, `maxEntries` cap, and page-URL construction.
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; adapter paginates via the axios-bound base URL and caps at `maxEntries`; no acceptance tests run. Presented for review before Milestone 4.

### Milestone 4: Composition root wiring + cleanup + final quality gate

- Update `src/presentation/cli/crawl.ts` to build `CrawlRequest` with `maxEntries: config.maxEntriesToFetch` (no `url`).
- Update `src/presentation/main.ts` to wire `config.maxPagesToFetch` into `HnWebAdapter`; `CrawlerUseCase` no longer receives `maxEntriesToFetch` in its constructor.
- Confirm no references to obsolete/removed code remain (e.g., the use-case 30 limit, `url` on `CrawlRequest`).
- Run final `npm run quality` — must be fully green.
- Verify the codebase is left in a clean, green, working state.

**Review gate**: `npm run quality` fully green; codebase clean and green; ready for user review.

### Final user-run acceptance

After all milestones are reviewed and approved, the user may run the acceptance suite against the configured deterministic URL by setting `HN_CRAWLER_WEB_PAGE_BASE_URL` (and `HN_CRAWLER_DB_PATH`) in the acceptance-test environment. The agent does not execute Cucumber. Any user-reported failure becomes a focused follow-up milestone that must leave `npm run quality` green.

## Complexity Tracking

No additional architecture or constitution exceptions are required.

## Planning Clarification — 2026-11-20

No `[NEEDS CLARIFICATION]` markers remain. All design decisions are resolved with documented assumptions:

- Env-var prefix is `HN_CRAWLER_` (established project convention).
- `MAX_ENTRIES_TO_FETCH` defaults to 30; `MAX_PAGES_TO_FETCH` defaults to 10 (per user input).
- Page-N URL is derived from page-1 URL by appending `?p=N` (or `&p=N` if a query string already exists), matching Hacker News's standard pagination.
- Behavioral-equivalence assumption: Hacker News page 1 returns 30 entries, so the adapter caps at 30 on the first page and stops — output is byte-identical to the pre-refactor behavior for the standard case. The deterministic acceptance page is expected to provide 30 entries on page 1, consistent with existing acceptance scenarios.
- `maxEntriesToFetch` (`config.maxEntriesToFetch`) is read by the CLI and placed into `CrawlRequest.maxEntries`; `CrawlerUseCase` reads `request.maxEntries` and passes it per-call to `fetchEntries(request.maxEntries)`. `maxPagesToFetch` (`config.maxPagesToFetch`) is constructor-injected into `HnWebAdapter`. The page URL is bound to the axios instance at startup, so neither `CrawlRequest` nor `fetchEntries` carries a `url`.
- Acceptance tests are not modified (no functional change), per the spec.
