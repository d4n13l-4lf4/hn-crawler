# Usage CLI Contract

## Invocation

```text
hn-crawler usage
```

The command accepts no feature-specific options or positional arguments.

## Output

Successful invocation prints `Usage data`, followed by an aligned ASCII table:

```text
Usage data
ID                                   | Request Timestamp | Applied Filters                          | Duration (ms)
-------------------------------------|-------------------|------------------------------------------|--------------
<UUIDv7 request ID>                  | <UNIX milliseconds> | <canonical applied filters>             | <duration>
```

Columns appear in this order: `ID`, `Request Timestamp`, `Applied Filters`, `Duration (ms)`. Widths are sized to fit headers and displayed values. Delimiter characters are escaped and line breaks are rendered visibly so each record occupies one row. Empty history displays the heading, column headers, and separator row with no data rows.

## Persistence lifetime

Records survive separate `crawl` and `usage` invocations and process restarts. Normal invocations store the database in the OS-appropriate user data directory for `hn-crawler`. Acceptance tests may supply a test-only database path override and reuse it across two separate CLI processes.

## Retention

At most the positive configured limit is retained. The default is 100. When older rows are removed, the most recently inserted records are kept and are displayed oldest-to-newest among the retained set.

## Errors

Crawl usage writes remain best effort and never change crawl success or the original crawl error. A usage database read failure, or a startup migration failure, is reported clearly and exits non-zero. Failed storage operations do not expose partial records or corrupt previously committed rows.
