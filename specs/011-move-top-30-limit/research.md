# Research: Move Top-30 Limit to HN Adapter

**Feature**: 011-move-top-30-limit  
**Date**: 2026-11-20  
**Status**: Complete — all design decisions resolved

## Decision: Pagination URL flow and adapter design

**Decision**:

- `CrawlRequest` (`crawler.port.ts`) drops `url` — the page URL is bound to the axios instance at startup via `baseURL` (the configured Hacker News URL) in the composition root. `CrawlRequest` gains `maxEntries: number`, which is the "up to" entries value the CLI supplies from `config.maxEntriesToFetch`.
- `EntrySourcePort.fetchEntries(maxEntries: number)` gains a `maxEntries` argument and drops the `url` argument; the adapter fetches pages against the axios-bound base URL.
- `HnWebAdapter.fetchEntries(maxEntries)` iterates pages 1..K with an efficient `for` loop bounded by `maxPagesToFetch` (constructor-injected from config, default 10):
  - Page 1 = empty path (resolves to the axios-bound base URL).
  - Page N (N > 1) = `?p=N` (or `&p=N` when `url` already contains a query string), matching Hacker News's standard pagination.
  - After fetching a page's HTML via `HnHttpClient.fetchPage(pageUrl)`, build the parser (POM) for that page (`new HnCrawlerParser(html)`).
  - If the parser reports no entries (`parser.hasEntries() === false`), break the page loop.
  - If entries exist, yield them one by one.
  - Stop (return) once the yielded count reaches `maxEntries`, breaking the page loop.
- `HnWebAdapter` constructor receives `httpClient` and `maxPagesToFetch`. No base URL is passed to the adapter or to `fetchEntries`.

**Rationale**: Directly implements the user's technical solution: move limiting to the adapter, pass `maxEntries` as a function argument via `CrawlRequest` (populated from `config.maxEntriesToFetch`), drop `url` because it is bound to axios at startup, paginate pages 1..K, break on empty page, break when enough entries collected. Behavior is preserved because Hacker News page 1 returns 30 entries, so the adapter caps at 30 on page 1 and stops — output is identical to the pre-refactor behavior for the standard case.

**Alternatives considered**:

- Keep `url` on `CrawlRequest` and pass it through to `fetchEntries` — rejected: the user explicitly wants `url` removed from `CrawlRequest` because it is bound to axios at startup.
- Keep the 30-entry cap in the use case and leave the adapter unchanged — rejected: contradicts the user's requirement to move limiting to the adapter and align with Single Responsibility.
- Have the adapter read `MAX_PAGES_TO_FETCH` directly from `process.env` — rejected: violates the dependency/injection pattern (config values are wired through constructors at the composition root, as done for `baseURL`/`axios` in spec 010).
- Fetch all pages up front and slice — rejected: violates the "efficient for loop" and streaming/yield requirement; would load unnecessary pages.

## Decision: Configuration values

**Decision**:

- `src/config/config.ts` gains two validated settings:
  - `maxEntriesToFetch` — env `HN_CRAWLER_MAX_ENTRIES_TO_FETCH`, default 30, must be a positive integer.
  - `maxPagesToFetch` — env `HN_CRAWLER_MAX_PAGES_TO_FETCH`, default 10, must be a positive integer.
- Both use the established `HN_CRAWLER_` env-var prefix and the same validation style as existing settings (`usageRetentionLimit`, `httpTimeout`, etc.).

**Rationale**: The user explicitly requested `MAX_ENTRIES_TO_FETCH` default 30 and `MAX_PAGES_TO_FETCH` default 10, controlled through the project config file with the `HN_CRAWLER_` prefix. The CLI reads `config.maxEntriesToFetch` and places it into `CrawlRequest.maxEntries`.

**Alternatives considered**:

- Hardcode 30 and 10 in the adapter/use case — rejected: contradicts the user's requirement that they be env-var controlled defaults in config.
- Make `maxEntries` a CLI option — rejected: no new user-facing options are allowed (spec SC-004); it is an internal config value.

## Decision: Use case no longer limits entries

**Decision**:

- Remove the `if (entries.length === 30) break` block from `CrawlerUseCase.execute()`.
- `CrawlerUseCase` no longer receives `maxEntriesToFetch` in its constructor. It calls `this.entrySource.fetchEntries(request.maxEntries)` using `maxEntries` from `CrawlRequest`. Every entry yielded by the adapter is piped through the pipeline; the use case imposes no entry-count cap.

**Rationale**: Satisfies FR-002/FR-003 (limiting responsibility moves from use case to adapter; use case processes every yielded entry). `CrawlRequest` carries the "up to" entries value sourced from `config.maxEntriesToFetch`. Keeps pipeline filtering/ranking intact.

**Alternatives considered**:

- Pass `maxEntries` through the constructor instead of `CrawlRequest` — rejected: the user wants `CrawlRequest` to be the vehicle for the "up to" entries value from `config.<paramName>`.
- Have the use case read config directly — rejected: the application layer never reads config directly; config is wired at the composition root / CLI.

## Decision: No acceptance tests

**Decision**: Per the spec, no acceptance tests (Cucumber/Gherkin) are implemented or automatically run by the agent. The existing acceptance scenarios remain unmodified (no functional change), per spec FR-005/SC-003. The agent does not execute Cucumber.

**Rationale**: The spec explicitly states acceptance tests won't change and none are to be implemented or automatically run.

## Open Items

None. All design decisions are resolved; no `[NEEDS CLARIFICATION]` markers remain.
