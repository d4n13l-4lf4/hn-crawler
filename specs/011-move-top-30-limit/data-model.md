# Data Model: Move Top-30 Limit to HN Adapter

**Feature**: 011-move-top-30-limit  
**Date**: 2026-11-20  
**Status**: Complete

## Entities

No new domain entities are introduced. The feature touches configuration and infrastructure concerns only; existing domain entities and value objects are unchanged.

### Story entry (`HNEntry`)

Unchanged domain entity representing a single Hacker News item.

| Field                | Type   | Description                                              |
| -------------------- | ------ | -------------------------------------------------------- |
| `rank`               | number | One-based position among entries retrieved from the page |
| `title`              | string | Entry title                                              |
| `points`             | number | Entry points (0 when missing/unparseable)                |
| `number_of_comments` | number | Entry comment count (0 when missing/unparseable)         |

## Configuration (`src/config/config.ts`)

The following limits are added to the application configuration, produced by `createConfig()`:

| Setting             | Env var                           | Type   | Default | Description                                                                          |
| ------------------- | --------------------------------- | ------ | ------- | ------------------------------------------------------------------------------------ |
| `maxEntriesToFetch` | `HN_CRAWLER_MAX_ENTRIES_TO_FETCH` | number | 30      | Maximum number of entries the adapter yields per crawl (the top-N candidate-set cap) |
| `maxPagesToFetch`   | `HN_CRAWLER_MAX_PAGES_TO_FETCH`   | number | 10      | Maximum number of Hacker News pages the adapter will fetch while looking for entries |

Both values must be positive integers and are validated with the same style as existing settings (`usageRetentionLimit`, `httpTimeout`, etc.). All values are parameterizable via environment variables with sensible defaults matching the specification.

## Entry-source port (`src/application/ports/out/entry-source.port.ts`)

`EntrySourcePort.fetchEntries(maxEntries: number): AsyncIterable<HNEntry>` — the `maxEntries` argument is the cap on entries yielded by the adapter. The `url` argument is removed because the page URL is bound to the axios instance at startup (`baseURL`). The interface remains an application-layer port.

## Crawl request (`src/application/ports/in/crawler.port.ts`)

`CrawlRequest` carries the per-crawl parameters:

| Field         | Type                     | Description                                                                                       |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `maxEntries`  | number                   | Maximum entries to fetch (the "up to" value, supplied by the CLI from `config.maxEntriesToFetch`) |
| `sortBy?`     | `'comments' \| 'points'` | Optional ranking metric                                                                           |
| `titleWords?` | `TitleWordRule`          | Optional title-word filter                                                                        |

The `url` field is removed; the page URL is bound to the axios instance at startup.

## Relationships

- `Crawl CLI` (`src/presentation/cli/crawl.ts`) builds `CrawlRequest` with `maxEntries: config.maxEntriesToFetch` (no `url`).
- `CrawlerUseCase` (application) calls `entrySource.fetchEntries(request.maxEntries)`; it imposes no entry-count limit and pipes every yielded entry through the pipeline.
- `HnWebAdapter` (infrastructure) constructor receives `httpClient` and `maxPagesToFetch`; its `fetchEntries(maxEntries)` paginates pages 1..`maxPagesToFetch` against the axios-bound base URL, builds a parser (POM) per page, yields entries, breaks on an empty page, and stops when `maxEntries` entries have been yielded.
- `HnHttpClient` (infrastructure) unchanged; wraps an axios instance bound to `baseURL` and exposes `fetchPage(url): Promise<string>`.
- `HnCrawlerParser` (infrastructure) unchanged; provides `hasEntries()` and async iteration over `HNEntry` objects — the "POM" built per page.
- `HNEntry` (domain) — unchanged; produced by the parser.
- `config` values flow from `src/presentation/main.ts` (composition root): `maxPagesToFetch` into the adapter via constructor; `maxEntriesToFetch` read by the CLI into `CrawlRequest.maxEntries`.

## Storage

No storage or schema change. Usage records remain unchanged, persisted via the existing SQLite usage repository.

## Acceptance-test environment

Acceptance tests target the crawl page via `HN_CRAWLER_WEB_PAGE_BASE_URL`, set in the acceptance-test environment. No new environment variables are required for acceptance; `HN_CRAWLER_MAX_ENTRIES_TO_FETCH` (30) and `HN_CRAWLER_MAX_PAGES_TO_FETCH` (10) use their defaults unless overridden.
