# Quickstart: Validate the Web Crawler Page Object Model

**Feature**: 009-crawler-page-object-model  
**Date**: 2026-11-19  
**Status**: Complete

## Purpose

Document runnable validation scenarios that prove the POM refactor preserves crawler behavior end-to-end. No acceptance tests are implemented or run for this feature; validation is via unit tests, the aggregate quality gate, and optional manual confirmation by the user.

## Prerequisites

- Node 26 LTS (per `.nvmrc` and `package.json` engines)
- Dependencies installed (`npm ci` or `npm install`)
- No network access required for unit tests (they use `tests/resources/hacker-news.html`)

## Validation Scenarios

### Scenario 1: Unit tests pass with 100% coverage

**Prerequisites**: None beyond installed dependencies.

**Commands**:

```bash
npm run test:coverage
```

**Expected outcome**: Vitest runs `tests/unit` with coverage thresholds enforced; all parser and adapter unit tests pass; aggregate coverage meets 100% for statements, branches, functions, and lines per file and overall.

**References**: `tests/unit/infrastructure/web/hn-crawler.parser.test.ts`, `tests/unit/infrastructure/web/hn-web.adapter.test.ts`

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

**Expected outcome**: `tsc --noEmit` exits 0 with no type errors, including the POM class and adapter changes.

### Scenario 4: Manual crawl behavior preservation (user-run, optional)

**Prerequisites**: Build completed (`npm run build`), `HN_CRAWLER_BETA=true`, `HN_CRAWLER_ACCEPTANCE_URL` set to a deterministic page, `HN_CRAWLER_DB_PATH` set to a temporary database path.

**Commands**:

```bash
HN_CRAWLER_BETA=true HN_CRAWLER_ACCEPTANCE_URL=<deterministic-url> HN_CRAWLER_DB_PATH=<temp-db> hn-crawler crawl
HN_CRAWLER_BETA=true HN_CRAWLER_ACCEPTANCE_URL=<deterministic-url> HN_CRAWLER_DB_PATH=<temp-db> hn-crawler usage
```

**Expected outcome**: Crawl output (rank, title, points, comments for up to 30 entries) and usage records (applied filter, entries scraped/returned) match pre-refactor output for the same deterministic page, across no-options, title-word-filter, and ranking invocations. The agent does not execute this scenario; the user runs it after implementation review.

**References**: Feature spec acceptance scenarios (User Story 1); `tests/acceptance/` features/steps (unchanged)

## What Is Not Included

- No implementation code, service/controller bodies, migrations, or complete test suites (per plan-template guidance)
- No acceptance test execution (agent-defereed per spec)
- No new CLI commands, options, or output formats
