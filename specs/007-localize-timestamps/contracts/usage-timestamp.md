# Usage Timestamp Display Contract

The `usage` command displays the timestamp under the `Request Date and Time` column header. Each persisted UTC-millisecond request timestamp is displayed as:

```text
YYYY-MM-DD HH:mm:ss (TZ)
```

The date, wall-clock time, and timezone abbreviation reflect the system timezone for that specific timestamp. Daylight-saving rules are applied per timestamp. If the local date/time or a useful timezone abbreviation is unavailable, display the instant in UTC using `(UTC)`.

The displayed timestamp does not alter persistence. The usage table keeps its other columns, order, alignment, empty-history output, options, and error behavior.
