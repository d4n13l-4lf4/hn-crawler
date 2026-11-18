# Data Model: Crawl Top Stories

**Feature**: 002-crawl-top-stories

## Title value object

Represents a story title under the domain's normalization rules.

| Property | Type   | Rule                                                                       |
| -------- | ------ | -------------------------------------------------------------------------- |
| `value`  | string | Constructed from raw string input; unusable or missing input becomes `''`. |

The value object is dependency-free and exposes its normalized primitive string for serialization.

## Numeric value object

Represents a numeric HN value (rank, points, or comment count).

| Property | Type   | Rule                                                                                                                                                                                                        |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`  | number | Constructed from raw numeric/text input; extract the first digit sequence using a precompiled `/\d+/` matcher when parsing text. Use `0` if no match exists, conversion is invalid, or the result is `NaN`. |

The value object is dependency-free. Rank is assigned from one-based document order; points and comments are derived from captured page metadata. The defaults are consistently owned by the domain layer.

## HNEntry entity

Represents one Hacker News story in page order.

| Field                | Domain type | JSON type | Rule                                                          |
| -------------------- | ----------- | --------- | ------------------------------------------------------------- |
| `rank`               | `Numeric`   | number    | One-based story position; invalid input defaults to `0`.      |
| `title`              | `Title`     | string    | Best-effort visible title text; empty default is `''`.        |
| `points`             | `Numeric`   | number    | Parsed first digit sequence; missing/invalid defaults to `0`. |
| `number_of_comments` | `Numeric`   | number    | Parsed first digit sequence; missing/invalid defaults to `0`. |

Entries remain in page order, and the crawler use case returns no more than the first 30. Rows with empty titles are retained so source positions and ranks are not silently shifted. The presentation serializer unwraps the four values and emits exactly the public JSON fields; the value object instances themselves are not exposed.

The first entry from `tests/resources/hacker-news.html` must serialize as:

```json
{
  "rank": 1,
  "title": "Java4Shell: RCE in OpenJDK when processing Base64",
  "points": 795,
  "number_of_comments": 211
}
```

## Crawl configuration and request

`src/config/config.ts` exposes `newsCombinatorUrl`, defaulting to `https://news.ycombinator.com/`. The composition root injects the configured URL into the crawl invocation. A beta `--url` value overrides it at the presentation boundary. The use case does not contain a URL default or read process environment directly.

The acceptance URL is external test configuration, not a domain entity: the acceptance process receives `HN_CRAWLER_ACCEPTANCE_URL`, mapped from the manually configured repository Actions variable in CI. The value is required by acceptance setup and has no public-site fallback.

## Failure behavior

- Non-success HTTP responses retain status context.
- Network errors are wrapped with operation context and retain the original exception through `Error.cause`.
- The presentation command continues to display the fixed crawler error message and return a non-zero status.
- Successful empty pages serialize as `[]`.
