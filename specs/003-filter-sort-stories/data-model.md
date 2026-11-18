# Data Model: Filter and Sort Hacker News Stories

## Existing story entry

The feature uses the existing `HNEntry` entity without changing its serialized form.

| Property | Domain representation | JSON property | Use |
|---|---|---|---|
| Rank | `Numeric` value object | `rank` | Original page position and stable tie order |
| Title | `Title` value object | `title` | Word-count predicate input |
| Points | `Numeric` value object | `points` | Points ranking value |
| Number of comments | `Numeric` value object | `number_of_comments` | Comments ranking value |

Numeric value objects normalize invalid or missing values to zero; title values normalize to an empty string. The CLI continues to emit exactly these four JSON fields.

## Pipeline configuration

The concrete application factory receives a configuration with:

| Property | Type | Required | Validation/meaning |
|---|---|---:|---|
| `sortBy` | `comments \| points` | Yes | Select descending ranking metric |
| `titleWords` | `{ operator: gt \| le; value: number }` | No | Apply title count greater-than or less-than-or-equal predicate |

The threshold is an integer from 1 through 10000. The factory itself receives validated configuration from the CLI/use-case boundary. If `titleWords` is omitted, all of the already-retrieved candidates are eligible.

## Crawler request boundary

The crawler inbound request remains independent from the concrete `PipelineConfig` type and carries user-level values: URL, ranking choice, and optional title-word operator/threshold. CLI defaults resolve to `sortBy: comments` and `titleWords: { operator: gt, value: 5 }`. The exact representation of this request should be a small application-owned type/interface and should not import from the pipeline factory folder.

## Processing constraints

- Retrieve no more than 30 source entries before processing.
- Apply title filter before ranking.
- Rank descending and retain source order for equal scores.
- Missing selected metric values behave as zero.
- Return no more than 30 entries; a valid filter with no matches returns an empty array.
- Processing steps are async iterable transformations; the filter is lazy and the top-K operator retains at most its configured window (30 here).
