# Implementation Plan: Resilient HTTP Client with Timeout and Retry

**Branch**: `010-replace-fetch-with-axios` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-replace-fetch-with-axios/spec.md`

## Summary

Replace the native `fetch`-based HTTP client with a resilient axios-based HTTP client. A new `src/infrastructure/web/axios.ts` module exposes a builder function that configures an axios instance with parameterizable timeout and server-error retry settings. The existing `src/infrastructure/web/hn-http.client.ts` becomes an `HnHttpClient` class that wraps the configured axios instance privately and exposes the same `fetchPage(url)` function signature. The `src/infrastructure/web/hn-web.adapter.ts` is refactored to use the new HTTP client, with the page URL sourced from configuration. Timeout, max retries, and retry delay are added to `config/config.ts`. The composition root (`src/presentation/main.ts`) wires the configured axios instance and HTTP client together. All other source code remains untouched. Functional behavior and existing acceptance scenarios are unchanged; no acceptance tests are implemented or automatically run for this feature. Delivery is incremental: each milestone leaves `npm run quality` green and is presented for review before the next begins.

## Technical Context

**Language/Version**: TypeScript strict mode; Node 26 LTS

**Primary Dependencies**: axios (already installed, `^1.21.1`); cheerio, commander, drizzle-orm, env-paths, @libsql/client (existing)

**Storage**: N/A — no storage or schema change

**Testing**: Vitest unit tests with 100% coverage (statements, branches, functions, lines per file and aggregate); Cucumber acceptance intentionally not implemented or run for this feature

**Target Platform**: Node.js CLI

**Project Type**: Standalone CLI

**Performance Goals**: HTTP requests bounded by a configurable timeout (default 15s); retries limited to a configurable count (default 3) on server errors only

**Constraints**: Respect hexagonal dependency direction (`presentation → application → domain`, `infrastructure → application (ports) + domain`); the HTTP client lives in infrastructure and imports only domain + axios; every implementation milestone must finish with `npm run quality` passing; acceptance is deferred to the user; behavior must be byte-identical to pre-refactor output; no new user-facing commands, options, or output formats; axios already installed (do not install); the axios instance is bound to a base URL via the builder in `axios.ts` and created in the composition root using the configured base URL (`HN_CRAWLER_WEB_PAGE_BASE_URL` env var, else `https://news.ycombinator.com/`); the `HN_CRAWLER_BETA` feature flag and `--url` option are removed — the acceptance-test page is targeted exclusively via `HN_CRAWLER_WEB_PAGE_BASE_URL`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Hexagonal architecture**: Pass. The HTTP client (`HnHttpClient`) is an infrastructure adapter concern. It imports axios and domain value objects only. `hn-web.adapter.ts` remains the infrastructure adapter implementing `EntrySourcePort`, now delegating to `HnHttpClient`. The application layer, domain, and `EntrySourcePort` interface are untouched. Concrete adapters are instantiated only in the composition root (`src/presentation/main.ts`).
- **Test-first development**: Pass. For each implementation milestone, add/adjust unit tests first, confirm new tests fail, implement behavior, then run `npm run quality` before review. Acceptance tests are not implemented or run for this feature per the spec.
- **Pipes and filters**: N/A. This refactor concerns the HTTP client adapter, not pipeline operators; pipeline behavior is unchanged.
- **Simplicity / YAGNI**: Pass. No new layers, folders, or dependencies beyond the single `axios.ts` module requested. File naming keeps the kebab-case role suffix convention (`.client.ts`, `.adapter.ts`). axios is already installed (no new install).
- **Deterministic domain rules**: Pass. The same HTTP fetch behavior (status error throwing, network error wrapping, text body return) is preserved inside `HnHttpClient.fetchPage`.

No constitution violations identified.

## Scale/Scope: HTTP client refactor (`src/infrastructure/web/hn-http.client.ts`), new axios module (`src/infrastructure/web/axios.ts`), adapter update (`src/infrastructure/web/hn-web.adapter.ts`), config additions (`src/config/config.ts`), composition root wiring (`src/presentation/main.ts`); tests mirror affected source modules

## Project Structure

### Documentation (this feature)

```text
specs/010-replace-fetch-with-axios/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── config.ts                 # Updated: adds timeout, maxRetries, retryDelay
├── domain/
│   └── entities/hn-entry.entity.ts          # Unchanged
├── application/
│   ├── ports/in/crawler.port.ts             # Unchanged
│   └── ports/out/entry-source.port.ts        # Unchanged
├── infrastructure/
│   └── web/
│       ├── axios.ts                  # NEW: builder + axios instance config
│       ├── hn-http.client.ts         # Refactored: HnHttpClient class wrapping axios
│       ├── hn-web.adapter.ts         # Refactored: uses HnHttpClient, URL from config
│       └── hn-http.client.ts         # (replaces fetchPage standalone function)
└── presentation/
    └── main.ts                       # Updated: composition root wires axios + HnHttpClient + adapter

tests/
└── unit/
    └── infrastructure/web/
        ├── axios.test.ts             # NEW: builder unit tests (table-driven)
        ├── hn-http.client.test.ts    # Refactored: HnHttpClient unit tests
        └── hn-web.adapter.test.ts    # Updated: adapter unit tests for new client
```

**Structure Decision**: Single project (DEFAULT). Use existing modules only; do not add a new layer or folder. The existing `hn-http.client.ts` file becomes the `HnHttpClient` class. A new `axios.ts` module holds the builder. The adapter and composition root are the only other source files touched. Tests mirror the affected source modules under `tests/unit/infrastructure/web/`.

## Incremental Delivery and Review Milestones

### Milestone 0: Acceptance test refactor (done first)

- In `tests/acceptance/features/crawl.feature`: remove "in beta mode" phrasing and `--url` from all scenario step text; remove the scenarios whose sole purpose was verifying the `--url` option ("Beta URL option selects the configured page", "Production help does not expose the URL option", "Production rejects the beta-only URL option"); reframe the invalid-URL scenario to not rely on `--url`.
- In `tests/acceptance/features/usage.feature`: remove "in beta mode" phrasing and `--url` from scenario step text.
- In `tests/acceptance/steps/crawl.steps.ts`: rename `getAcceptanceUrl()` to read `HN_CRAWLER_WEB_PAGE_BASE_URL`; remove `--url` from all `runCli` calls; remove the "production mode" step (`HN_CRAWLER_BETA: ''`); remove beta-mode phrasing from step definitions.
- In `tests/acceptance/steps/usage.steps.ts`: rename `getAcceptanceUrl()` to read `HN_CRAWLER_WEB_PAGE_BASE_URL`; remove `--url` from `runCli` calls; remove `HN_CRAWLER_BETA: 'true'` from `runCli` env; remove beta-mode phrasing from step definitions.
- These acceptance tests are NOT run by the agent; they are refactored first and manually run by the user at the end of the whole implementation.
- Run `npm run quality` (typecheck/lint/format only for acceptance test files are not part of `test:unit`, but ensure the files remain syntactically valid TypeScript via `npm run typecheck`).

**Review gate**: Acceptance test files refactored and typecheck-clean; user runs acceptance manually at the end. Presented for review before Milestone 1.

### Milestone 1: Config additions + axios builder module

- Add `httpTimeout`, `httpMaxRetries`, `httpRetryDelay` to `src/config/config.ts` (defaults: 15000ms, 3, 3000ms).
- Create `src/infrastructure/web/axios.ts` with a builder function `createAxiosHttpClient({ baseURL, timeout, maxRetries, retryDelay })` that configures and returns an axios instance bound to `baseURL`, with timeout + server-error retry interceptor.
- Add table-driven unit tests for `axios.ts` (test-first: confirm they fail, then implement).
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; no acceptance tests run.

### Milestone 2: Refactor `hn-http.client.ts` to `HnHttpClient` class

- Convert `src/infrastructure/web/hn-http.client.ts` from the `fetchPage(url)` standalone function to an `HnHttpClient` class.
- Constructor receives a configured axios instance as a constructor argument (private property).
- Expose `fetchPage(url: string): Promise<string>` with the same signature/behavior as before (status error → throw, network error → wrap with cause, return text).
- Refactor existing `hn-http.client.test.ts` to test `HnHttpClient` (test-first: confirm failures, then implement).
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; no acceptance tests run.

### Milestone 3: Refactor `hn-web.adapter.ts` to use `HnHttpClient`

- Update `src/infrastructure/web/hn-web.adapter.ts` to construct/use `HnHttpClient` instead of the `{ fetch }` object.
- The adapter no longer handles the page URL itself; the URL is bound to the axios instance at the composition root via config (`HN_CRAWLER_WEB_PAGE_BASE_URL` env var, else default).
- Remove the `HN_CRAWLER_BETA` feature flag and `--url` option from `cli/crawl.ts`.
- Update adapter unit tests (test-first: confirm failures, then implement).
- Run `npm run quality` — must be green before review.

**Review gate**: `npm run quality` green; no acceptance tests run.

### Milestone 4: Composition root wiring + remove obsolete code

- Update `src/presentation/main.ts` to build the axios instance via the builder with `baseURL` from `config.newsCombinatorUrl` (`HN_CRAWLER_WEB_PAGE_BASE_URL` env var or default), create `HnHttpClient`, and inject it into `HnWebAdapter`.
- Delete the old standalone `fetchPage` function and any now-unused imports/code.
- Confirm no references to removed code remain (including `HN_CRAWLER_ACCEPTANCE_URL`, `HN_CRAWLER_BETA`, `--url`).
- Run final `npm run quality` — must be fully green.

**Review gate**: `npm run quality` green; codebase in a clean, green state ready for user review.

### Final user-run acceptance

After all milestones are reviewed and approved, the user may run the acceptance suite against the configured deterministic URL by setting `HN_CRAWLER_WEB_PAGE_BASE_URL` (and `HN_CRAWLER_DB_PATH`) in the acceptance-test environment — no `HN_CRAWLER_BETA` flag or `--url` option is used. The agent does not execute Cucumber. Any user-reported failure becomes a focused follow-up milestone that must leave `npm run quality` green.

## Complexity Tracking

No additional architecture or constitution exceptions are required.

## Planning Clarification — 2026-11-19

Resolved: The axios instance is bound to a base URL via `createAxiosHttpClient({ timeout, maxRetries, retryDelay, baseURL })` in `src/infrastructure/web/axios.ts`. The base URL is supplied from `config.newsCombinatorUrl`, which resolves to `HN_CRAWLER_WEB_PAGE_BASE_URL` env var when set, otherwise the default `https://news.ycombinator.com/`. The composition root creates the axios instance with this bound URL and wires it into `HnHttpClient` and `HnWebAdapter`. The `HN_CRAWLER_BETA` feature flag and `--url` option are removed; acceptance testing targets the page exclusively via `HN_CRAWLER_WEB_PAGE_BASE_URL`. No `[NEEDS CLARIFICATION]` markers remain.
