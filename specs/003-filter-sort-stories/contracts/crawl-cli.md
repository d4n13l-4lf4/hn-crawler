# Crawl CLI Contract

## Invocation

```text
hn-crawler crawl [--top-comments | --top-points] [--title-words <gt:N|le:N>]
```

The existing beta-only `--url <url>` option remains governed by the deployment feature flag and is not changed by this feature.

## Defaults and combinations

- No ranking option means comments descending.
- No title-word option means `gt:5`.
- Either ranking option can be combined with either title-word filter.
- Supplying both ranking options is an argument error.
- Candidates are the first 30 entries retrieved from the configured page (or fewer if fewer are available). Filtering occurs before ranking; ties preserve page order.

## Title-word argument

- `gt:N`: retain title word counts greater than N.
- `le:N`: retain title word counts less than or equal to N.
- N must be an integer in `[1, 10000]`.
- A value above 10000 prints exactly: `The maximum value for the title words filter is 10000. Please use a value between 1 and 10000 (e.g., gt:100).`
- Values below 1, malformed values, and unsupported comparators are argument errors.

## Output and status

On success, exit status is zero and stdout is a JSON array. Each object has exactly `rank`, `title`, `points`, and `number_of_comments`; there are at most 30 objects.

On crawl/processing failure, stderr contains `An error occurred while running the crawler. Please try again.` and the process exits non-zero. Argument failures also exit non-zero with their argument-specific error.

## Acceptance test boundary

Acceptance tests invoke the runnable CLI as a process, assert its streams and exit status, and do not import source files or refer to source artifact paths. Deterministic URL configuration is supplied through the existing acceptance environment configuration.
