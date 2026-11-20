# Data Model: Resilient HTTP Client with Timeout and Retry

**Feature**: 010-replace-fetch-with-axios  
**Date**: 2026-11-19  
**Status**: Complete

## Entities

No new domain entities are introduced. The feature touches infrastructure concerns only.

## Configuration (config/config.ts)

The following resilience settings are added to the application configuration, produced by `createConfig()`:

| Setting          | Type        | Default | Description                                                                           |
| ---------------- | ----------- | ------- | ------------------------------------------------------------------------------------- |
| `httpTimeout`    | number (ms) | 15000   | Maximum time allowed for an HTTP request before it is aborted and handled as an error |
| `httpMaxRetries` | number      | 3       | Maximum number of automatic retries on server-error responses                         |
| `httpRetryDelay` | number (ms) | 3000    | Pause between consecutive retry attempts                                              |

`newsCombinatorUrl` resolves to the `HN_CRAWLER_WEB_PAGE_BASE_URL` env var when set, otherwise the default `https://news.ycombinator.com/`. All values are parameterizable and have sensible defaults matching the specification (15 seconds, 3 retries, 3 seconds).

## HTTP Client Output

The `HnHttpClient.fetchPage(url)` method returns a `Promise<string>` — the raw HTML body of the fetched page, resolved against the axios instance's bound `baseURL`. It throws on:

- Non-ok HTTP statuses (server errors and client errors alike), with message `HTTP ${status}: ${statusText}`.
- Network failures, wrapping the original error as the cause with message `Failed to fetch page from ${url}`.

Server errors (5xx) are retried up to `httpMaxRetries` times with `httpRetryDelay` between attempts before being treated as a failure. Non-server errors are not retried.

## Relationships

- `HnHttpClient` (infrastructure) wraps an axios instance bound to `baseURL`; imports axios only (no domain dependency).
- `HnWebAdapter` (infrastructure) receives `HnHttpClient` via constructor; the page URL is bound at the composition root, not passed to the adapter; implements `EntrySourcePort` (unchanged).
- `EntrySourcePort.fetchEntries(url): AsyncIterable<HNEntry>` — unchanged interface.
- `HNEntry` (domain) — unchanged; produced by the parser, not the HTTP client.

## Storage

No storage or schema change. Usage records remain text descriptions persisted via the existing SQLite usage repository.

## Acceptance-test environment

Acceptance tests target the crawl page via `HN_CRAWLER_WEB_PAGE_BASE_URL` (renamed from `HN_CRAWLER_ACCEPTANCE_URL`), set in the acceptance-test environment. The `HN_CRAWLER_BETA` feature flag and `--url` CLI option are removed.
