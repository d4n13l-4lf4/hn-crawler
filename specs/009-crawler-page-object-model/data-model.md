# Data Model: Web Crawler Page Object Model

**Feature**: 009-crawler-page-object-model  
**Date**: 2026-11-19  
**Status**: Complete

## Entities

No new domain entities are introduced. The POM produces and consumes the existing domain entity.

### HNEntry (existing, unchanged)

**File**: `src/domain/entities/hn-entry.entity.ts`

Represents a single Hacker News entry extracted from the page.

| Field                | Type      | Description                                  |
| -------------------- | --------- | -------------------------------------------- |
| `rank`               | `Numeric` | One-based position on the page (1..30)       |
| `title`              | `Title`   | Entry title text                             |
| `points`             | `Numeric` | Points score; 0 when missing or unparseable  |
| `number_of_comments` | `Numeric` | Comment count; 0 when missing or unparseable |

**Validation rules** (existing, enforced by value objects):

- `Numeric`: whitespace-separated tokens containing at least one letter or digit; missing/unparseable integer values count as 0
- `Title`: title text; empty string when no readable title

**State transitions**: None. `HNEntry` is an immutable value object.

## POM Output

The POM (`HnCrawlerParser`) yields `HNEntry` instances one by one through its async iterator, in source order, with one-based ranks. It produces no other data structures.

## Relationships

- `HnCrawlerParser` (infrastructure) → imports `HNEntry`, `Title`, `Numeric` (domain) only — dependency rule respected
- `HnWebAdapter` (infrastructure) → constructs `HnCrawlerParser` with fetched HTML, yields its entries via `EntrySourcePort`
- No changes to `EntrySourcePort`, `HNEntry`, or any domain/value-object types

## Storage

No storage or schema change. Usage records remain text descriptions persisted via the existing SQLite usage repository.
