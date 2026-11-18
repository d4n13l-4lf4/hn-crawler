# CLI Contract: Crawl Top Stories

**Feature**: `002-crawl-top-stories`

## Command

```text
hn-crawler crawl [--url <url>]
```

`--url` appears in command help only when `HN_CRAWLER_BETA=true`. If unset or any other value, the option is unsupported and Commander reports its standard usage error with a non-zero status. The command's default source URL is injected from `src/config/config.ts` by the composition root; the use case itself has no URL default.

## Input

| Input         | Availability                       | Default                                                          | Meaning                  |
| ------------- | ---------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| `--url <url>` | Beta only (`HN_CRAWLER_BETA=true`) | Configured `newsCombinatorUrl` (`https://news.ycombinator.com/`) | Page to fetch and parse. |

No filtering or pagination options are supported.

## Success output

Write one JSON array to standard output. It contains up to 30 entries, in page order. Each object contains exactly:

```json
{
  "rank": 1,
  "title": "My news",
  "points": 1,
  "number_of_comments": 2
}
```

An empty successful result is `[]`. Missing points and comment counts are output as zero. The process exits with status `0` on success.

## Crawl failure

For HTTP failures, network failures, or content/parsing failures that prevent a successful crawl, write the following message to standard error and exit non-zero:

```text
An error occurred while running the crawler. Please try again.
```

The underlying HTTP client preserves the original network exception or reports the HTTP status; the CLI owns the user-facing generic message. Do not catch Commander option-validation errors in the crawler error handler.

The repository example `tests/resources/hacker-news.html` is the parser selector reference. Acceptance scenarios read `HN_CRAWLER_ACCEPTANCE_URL`; CI maps the same-named manually configured repository Actions variable into the acceptance process, validates it before running Cucumber, and sets `HN_CRAWLER_BETA=true`. Acceptance setup must fail if the variable is absent and must not fall back to the live HN site. Do not run acceptance tests locally during this feature. Because one environment variable provides the page for the suite, empty and fewer-than-30 pages remain parser unit-test cases; the acceptance suite covers the configured page, beta URL selection, crawler failure, and production option behavior.

The parser's first-entry reference result is rank `1`, title `Java4Shell: RCE in OpenJDK when processing Base64`, points `795`, and `number_of_comments` `211`. Missing/unreadable titles map to an empty string; missing or invalid integer counts map to `0`.

## Invalid option in production

When `--url` is supplied while beta mode is disabled, display the standard Commander usage error and exit non-zero. Do not convert this option-validation error into the crawler failure message.

## Exit status summary

|   Status | Meaning                                                  |
| -------: | -------------------------------------------------------- |
|      `0` | Crawl completed successfully, including an empty result. |
| Non-zero | Crawl failed or CLI option validation failed.            |
