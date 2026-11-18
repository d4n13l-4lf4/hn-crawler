# Usage CLI Contract

## Invocation

```text
hn-crawler usage
```

The command accepts no feature-specific options or positional arguments.

## Output

Successful invocation writes a JSON array to stdout. Empty history is `[]`. Each entry contains exactly:

```json
{
  "request_id": "<UUIDv7>",
  "request_timestamp": 123123123,
  "applied_filters": "sort:number_of_comments:desc|sort:title_words:gt:5",
  "duration_ms": 122
}
```

The `applied_filters` example uses sort-first ordering. If there is no title rule, only the sort tag appears. Records are ordered by request insertion time.

## Lifetime

History is held in process-local memory. A newly started process has empty history; records do not persist between independent invocations or restarts.

## Errors

Unsupported options or arguments are rejected using the standard CLI argument error and non-zero status. Usage read errors use the command's standard failure behavior. A tracking write failure is isolated and never changes the crawl result or original crawl error.
