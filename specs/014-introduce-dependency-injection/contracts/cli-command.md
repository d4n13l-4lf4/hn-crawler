# CLI Command Contract

**Feature**: 014-introduce-dependency-injection  
**Status**: Unchanged (internal refactor)

## Overview

The Hacker News Crawler CLI exposes the following commands to users. This dependency-injection refactor is internal and introduces **no changes** to the command contract, options, output format, exit codes, or error handling.

## Commands

### `crawl`

Scrapes up to the first 30 Hacker News entries, optionally filters by title word count, optionally ranks by comments or points, and records crawl usage.

**Options** (unchanged):

- `--filter <gt:N|le:N>` — title-word filter (default: `gt:5`)
- `--rank <comments|points>` — ranking metric (default: `comments`)
- `--url <url>` — optional beta override for the Hacker News page URL

**Output** (unchanged): Ranked entries with rank, title, points, and comments fields.

**Exit codes** (unchanged): `0` on success, non-zero on error.

### `usage`

Displays recorded crawl usage records from the SQLite database.

**Options** (unchanged): none.

**Output** (unchanged): Usage records with timestamp, applied filter, source URL, entries scraped, entries returned, duration, and outcome.

**Exit codes** (unchanged): `0` on success, non-zero on error.

## Contract Impact

- **Commands**: No additions, removals, or renames.
- **Options**: No additions, removals, or changes.
- **Output format**: Unchanged.
- **Exit codes**: Unchanged.
- **Error handling**: Unchanged.

This contract is validated by the existing acceptance test suite, which runs with zero modifications.
