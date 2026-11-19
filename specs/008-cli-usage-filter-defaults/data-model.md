# Data Model: CLI Usage and Filter Defaults

## Crawl request

Represents one requested retrieval from a source page.

| Field | Meaning | Rule |
|---|---|---|
| URL | Source page to retrieve | Required; existing default and beta override behavior remain |
| Ranking choice | `comments`, `points`, or absent | An absent choice preserves page order |
| Title-word rule | Comparator and positive word limit, or absent | An absent rule leaves all retrieved titles eligible |

The crawler takes at most the first 30 entries before applying any requested filter and ranking. A title-only request filters while preserving source order. A ranking-only request ranks all retrieved entries. A combined request filters then ranks. With neither option, the first 30 entries pass through unchanged.

## Applied filters value

A display/persistence value associated with a usage record.

- No selected filtering or ranking: `none`.
- Ranking only: `sort:number_of_comments:desc` or `sort:number_of_points:desc`.
- Title rule only: `filter:title_words:<comparator>:<limit>`.
- Both: ranking label followed by title-filter label, comma-separated, preserving established ordering.
- Existing usage records remain readable as stored text; no database schema change is needed.

## Package version

The package release version is displayed by the root CLI version option and is sourced from the package's declared version.
