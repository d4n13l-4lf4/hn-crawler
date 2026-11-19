# Research: Resilient HTTP Client with Timeout and Retry

**Feature**: 010-replace-fetch-with-axios  
**Date**: 2026-11-19  
**Status**: Complete — URL-flow clarification resolved

## Decision: URL flow and HTTP client design

**Decision**: 
- New module `src/infrastructure/web/axios.ts` exports a builder function `createAxiosHttpClient({ baseURL, timeout, maxRetries, retryDelay })` that configures and returns an axios instance **bound to `baseURL`** via axios's `baseURL` config, plus a timeout and a server-error-only retry interceptor. Because the axios instance carries the base URL, `fetchPage(path)` can be called with a path relative to the bound base URL.
- `src/infrastructure/web/hn-http.client.ts` becomes an `HnHttpClient` class wrapping the axios instance privately (`private readonly http`). It exposes `fetchPage(url: string): Promise<string>` with the same signature/behavior as the previous standalone function (status errors throw, network errors wrap with cause, returns text body).
- `src/infrastructure/web/hn-web.adapter.ts` receives an `HnHttpClient` instance via its constructor. The page URL is **no longer passed to the adapter**; it is bound to the axios instance at the composition root. The adapter's `fetchEntries()` takes no URL argument.
- `src/config/config.ts` gains `httpTimeout` (default 15000ms), `httpMaxRetries` (default 3), and `httpRetryDelay` (default 3000ms). `newsCombinatorUrl` resolves to `HN_CRAWLER_WEB_PAGE_BASE_URL` env var when set, otherwise the default `https://news.ycombinator.com/`.
- `src/presentation/main.ts` (composition root) builds the axios instance via the builder using `config.newsCombinatorUrl` as `baseURL`, creates `HnHttpClient`, and injects it into `HnWebAdapter`.
- The `HN_CRAWLER_BETA` feature flag and `--url` CLI option are removed. Acceptance testing targets the page exclusively via `HN_CRAWLER_WEB_PAGE_BASE_URL` env var (renamed from `HN_CRAWLER_ACCEPTANCE_URL`).

**Rationale**: This satisfies every explicit user constraint (axios already installed, `axios.ts` builder receives URL + timeout + retry settings, constructor-injected axios instance, same `fetchPage` signature, adapter no longer handles URL, timeout/retry in config, composition-root wiring with bound base URL) while preserving behavior. The `--url` beta option and `HN_CRAWLER_ACCEPTANCE_URL` env var are removed because the base URL is now bound to the axios instance and overridden via env var; acceptance tests set `HN_CRAWLER_WEB_PAGE_BASE_URL` to point at the deterministic page.

**Alternatives considered**:
- Keep `--url` beta option and per-request URL in `fetchPage` — rejected: contradicts the user's decision to bind the base URL to the axios instance and remove `--url`.
- Keep `HN_CRAWLER_ACCEPTANCE_URL` env var name — rejected: user explicitly requested renaming to `HN_CRAWLER_WEB_PAGE_BASE_URL`.
- Keep the standalone `fetchPage` function and add axios separately — rejected: duplicates the HTTP client and violates Simplicity/YAGNI (the user explicitly wants the hn http client refactored to use axios).

## Decision: No new dependencies

**Decision**: axios is already installed (declared in `package.json` dependencies as `^1.21.1` and present in `node_modules`). No `npm install` is performed.

**Rationale**: The user explicitly stated axios is already installed. Adding an install step would be unnecessary and could conflict with the locked version.

**Alternatives considered**: Running `npm install axios` — rejected per user instruction.

## Decision: No acceptance tests

**Decision**: Per the spec, no acceptance tests (Cucumber/Gherkin) are implemented or automatically run by the agent. However, the existing acceptance tests MUST be refactored first (Milestone 0) to remove the `--url` option and "beta mode" references, since the base URL is now bound to the axios instance and overridden via `HN_CRAWLER_WEB_PAGE_BASE_URL` env var instead. These refactored acceptance tests are manually run by the user at the end of the whole implementation.

**Acceptance test refactor scope (Milestone 0)**:
- `tests/acceptance/features/crawl.feature`: remove "in beta mode" phrasing and `--url` from all scenario step text; remove the three scenarios whose sole purpose was verifying `--url` ("Beta URL option selects the configured page", "Production help does not expose the URL option", "Production rejects the beta-only URL option"); reframe the invalid-URL scenario to not rely on `--url`.
- `tests/acceptance/features/usage.feature`: remove "in beta mode" phrasing and `--url` from scenario step text.
- `tests/acceptance/steps/crawl.steps.ts`: rename `getAcceptanceUrl()` to read `HN_CRAWLER_WEB_PAGE_BASE_URL`; remove `--url` from all `runCli` calls; remove the "production mode" step (`HN_CRAWLER_BETA: ''`); remove beta-mode phrasing from step definitions.
- `tests/acceptance/steps/usage.steps.ts`: rename `getAcceptanceUrl()` to read `HN_CRAWLER_WEB_PAGE_BASE_URL`; remove `--url` from `runCli` calls; remove `HN_CRAWLER_BETA: 'true'` from `runCli` env; remove beta-mode phrasing from step definitions.

**Rationale**: The base URL is bound to the axios instance at the composition root via config (`HN_CRAWLER_WEB_PAGE_BASE_URL` env var or default), so the `--url` beta option is no longer needed and is removed. The spec explicitly states acceptance tests won't change functionally, but since the `--url` mechanism itself is being removed, the acceptance tests that exercise it must be refactored to use the env var instead.

## Open Items

None. All design decisions are resolved; no `[NEEDS CLARIFICATION]` markers remain.
