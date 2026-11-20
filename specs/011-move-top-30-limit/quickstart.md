# Quickstart Validation Guide: Move Top-30 Limit to HN Adapter

**Feature**: 011-move-top-30-limit  
**Date**: 2026-11-20

## Purpose

Document runnable validation scenarios that prove the refactor preserves existing crawl behavior end-to-end: the command still returns at most 30 entries from the first page, in page order, with identical fields and exit codes. This guide is a validation/run reference; implementation details belong in `tasks.md` and the implementation phase.

## Prerequisites

- Build completed: `npm run build`
- The CLI is installed/run against the built binary (`dist/presentation/main.js`)
- `HN_CRAWLER_WEB_PAGE_BASE_URL` set to a deterministic page (e.g., the static fixture or a captured Hacker News page) that provides 30 entries on page 1
- `HN_CRAWLER_DB_PATH` set to a temporary database path for usage recording
- Optional overrides: `HN_CRAWLER_MAX_ENTRIES_TO_FETCH` (default 30), `HN_CRAWLER_MAX_PAGES_TO_FETCH` (default 10)

## Build

```
npm run build
```

## Validation scenarios

Run each scenario against the deterministic page and compare to pre-refactor behavior.

### 1. Default crawl returns up to 30 entries in page order

```
HN_CRAWLER_WEB_PAGE_BASE_URL=<deterministic-page-url> \
  HN_CRAWLER_DB_PATH=<temp-db> \
  hn-crawler crawl
```

Expected outcome:

- Output is a JSON array with at most 30 entries.
- Every entry has exactly the fields `rank`, `title`, `points`, `number_of_comments`.
- Ranks increase by one from 1 (source order preserved).
- Exit code is 0.

### 2. Crawl ranking by comments

```
HN_CRAWLER_WEB_PAGE_BASE_URL=<deterministic-page-url> \
  HN_CRAWLER_DB_PATH=<temp-db> \
  hn-crawler crawl --top-comments --title-words le:10000
```

Expected outcome:

- Output is a JSON array with at most 30 entries.
- Entries are ordered by `number_of_comments` descending.
- Exit code is 0.

### 3. Crawl ranking by points

```
HN_CRAWLER_WEB_PAGE_BASE_URL=<deterministic-page-url> \
  HN_CRAWLER_DB_PATH=<temp-db> \
  hn-crawler crawl --top-points
```

Expected outcome:

- Output is a JSON array with at most 30 entries.
- Entries are ordered by `points` descending.
- Exit code is 0.

### 4. Title-word filtering without ranking

```
HN_CRAWLER_WEB_PAGE_BASE_URL=<deterministic-page-url> \
  HN_CRAWLER_DB_PATH=<temp-db> \
  hn-crawler crawl --title-words gt:5
```

Expected outcome:

- Output contains only titles with more than 5 words.
- Source order is preserved (no ranking).
- Exit code is 0.

### 5. Crawl failure with invalid URL

```
HN_CRAWLER_WEB_PAGE_BASE_URL=fake \
  HN_CRAWLER_DB_PATH=<temp-db> \
  hn-crawler crawl
```

Expected outcome:

- Stderr contains `An error occurred while running the crawler. Please try again.`.
- Exit code is non-zero.

### 6. Conflicting ranking options rejected

```
hn-crawler crawl --top-comments --top-points
```

Expected outcome:

- Stderr contains `The --top-comments and --top-points options cannot be used together.`.
- Exit code is non-zero.

## Verifying the refactor

- Run scenarios 1–5 against the same deterministic page before and after the refactor; output (JSON, ordering, exit codes) must be byte-identical.
- Run `npm run quality` (format, lint, typecheck, test+coverage) — must be fully green.
- No new CLI options, commands, or output formats are introduced.
- Acceptance tests (Cucumber) are not modified and are run manually by the user at the end of the implementation; the agent does not execute them.

## References

- Feature specification: `specs/011-move-top-30-limit/spec.md`
- Implementation plan: `specs/011-move-top-30-limit/plan.md`
- Data model: `specs/011-move-top-30-limit/data-model.md`
- Contracts: none (the CLI command contract is unchanged by this refactor)
