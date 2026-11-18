# Data Model: Best-Effort Usage Tracking

## Usage entity

One entity represents a crawl attempt.

| Field | Type | Required | Rule |
| --- | --- | ---: | --- |
| `request_id` | UUIDv7 string | Yes | Unique per tracked crawl attempt |
| `request_timestamp` | Integer Unix milliseconds UTC | Yes | Captured at request start |
| `applied_filters` | `AppliedFilters` value object | Yes | Stable sort tag plus optional title rule tag |
| `duration_ms` | Non-negative integer | Yes | Monotonic elapsed time, rounded/floored to integer milliseconds |

The user-visible JSON contains these four fields. Storage-specific metadata is excluded from serialization.

## AppliedFilters value object

The value object holds the semantic choices without requiring callers to construct tag strings.

- Sort is required and is either comments descending or points descending.
- Title rule is optional and is either `gt:N` or `le:N`.
- Canonical serialization orders the sort tag before the title tag.
- Sort mappings: comments → `sort:number_of_comments:desc`; points → `sort:number_of_points:desc`.
- Title mappings: `gt:N` → `sort:title_words:gt:N`; `le:N` → `sort:title_words:le:N`.
- With no title rule, serialization includes the sort tag only.

## Usage history

A repository owns an insertion-ordered list for the current process lifetime. `getAll` returns all records in request order and does not expose mutable internal list state. A process restart yields empty history.

## Crawler integration

The decorator receives the same normalized crawl request as the core use case. Its sort choice and optional title rule are mapped into `AppliedFilters`. URL is not part of the public usage entity. One record is attempted whether the wrapped crawler resolves or rejects.
