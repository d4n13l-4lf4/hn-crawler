# Quickstart: Validate the Resilient HTTP Client with Timeout and Retry

**Feature**: 010-replace-fetch-with-axios  
**Date**: 2026-11-19  
**Status**: Complete

## Purpose

Document runnable validation scenarios that prove the HTTP client refactor preserves crawler behavior end-to-end. No acceptance tests are implemented or run for this feature; validation is via unit tests, the aggregate quality gate, and optional manual confirmation by the user.

## Prerequisites

- Node 26 LTS (per `.nvmrc` and `package.json` engines)
- Dependencies installed (`npm ci` or `npm install`); axios is already installed (`^1.21.1`)
- No network access required for unit tests (they use mocked axios / static fixtures)

## Validation Scenarios

### Scenario 1: Unit tests pass with 100% coverage

**Prerequisites**: None beyond installed dependencies.

**Commands**:

```bash
npm run test:coverage
```

**Expected outcome**: Vitest runs `tests/unit` with coverage thresholds enforced; all HTTP client, axios builder, and adapter unit tests pass; aggregate coverage meets 100% for statements, branches, functions, and lines per file and overall.

**References**: `tests/unit/infrastructure/web/axios.test.ts`, `tests/unit/infrastructure/web/hn-http.client.test.ts`, `tests/unit/infrastructure/web/hn-web.adapter.test.ts`

### Scenario 2: Aggregate quality gate passes

**Prerequisites**: Scenario 1 passing.

**Commands**:

```bash
npm run quality
```

**Expected outcome**: Prettier format, format check, ESLint, TypeScript typecheck (`tsc --noEmit`), and unit tests with coverage all pass. Exit code 0.

**References**: `package.json` `quality` script

### Scenario 3: Typecheck confirms no type errors

**Prerequisites**: None beyond installed dependencies.

**Commands**:

```bash
npm run typecheck
```

**Expected outcome**: `tsc --noEmit` exits 0 with no type errors, including the axios builder, `HnHttpClient`, adapter, config, and composition root changes.

### Scenario 4: Manual crawl behavior preservation (user-run, optional)

**Prerequisites**: Build completed (`npm run build`), `HN_CRAWLER_WEB_PAGE_BASE_URL` set to a deterministic page (replacing `HN_CRAWLER_ACCEPTANCE_URL`), `HN_CRAWLER_DB_PATH` set to a temporary database path. The `HN_CRAWLER_BETA` flag and `--url` option are removed.

**Commands**:

```bash
HN_CRAWLER_WEB_PAGE_BASE_URL=<deterministic-url> HN_CRAWLER_DB_PATH=<temp-db> hn-crawler crawl
HN_CRAWLER_WEB_PAGE_BASE_URL=<deterministic-url> HN_CRAWLER_DB_PATH=<temp-db> hn-crawler usage
```

**Expected outcome**: Crawl output (rank, title, points, comments for up to 30 entries) and usage records (applied filter, entries scraped/returned) match pre-refactor output for the same deterministic page, across no-options, title-word-filter, and ranking invocations. The agent does not execute this scenario; the user runs it after implementation review.

**References**: Feature spec acceptance scenarios (User Story 1); `tests/acceptance/` features/steps (refactored in Milestone 0 to remove `--url`/beta mode; manually run by user at the end)

## What Is Not Included

- No implementation code, service/controller bodies, migrations, or complete test suites (per plan-template guidance)
- Acceptance tests are refactored in Milestone 0 (remove `--url`/beta mode) but NOT executed by the agent; the user runs them manually at the end
- No new CLI commands, options, or output formats
- No changes to `EntrySourcePort` or any domain/value-object types
- The `HN_CRAWLER_BETA` feature flag and `--url` CLI option are removed
