# Research: Best-Effort Usage Tracking

## Decisions

### UUIDv7 generation

- **Decision**: Use Node 26's built-in `crypto.randomUUIDv7()`.
- **Rationale**: The repository pins Node 26, where this API is available. It satisfies UUIDv7 without adding a runtime dependency.
- **Alternatives considered**: Add a third-party UUID package or implement UUIDv7 generation manually. Both add avoidable maintenance or dependency cost.

### Applied filter value object

- **Decision**: Store supported semantic filter tags in the value object and expose builder operations for sort and optional title filtering. Serialize tags as a stable string with sort first and title rule second. Omit title tag when no title filter is applied.
- **Rationale**: Domain callers can describe intent without duplicating wire strings, and record output remains deterministic.
- **Alternatives considered**: Construct the final string in the CLI, mapper, or decorator. These leak the tagging convention into orchestration/presentation code.

### Duration and timestamp

- **Decision**: Capture wall-clock UTC milliseconds for `request_timestamp` and monotonic elapsed milliseconds for duration; round/floor duration to a non-negative integer.
- **Rationale**: Wall clocks express event time; monotonic clocks avoid system clock adjustments corrupting elapsed duration.
- **Alternatives considered**: Use wall-clock subtraction for both fields, which can produce inaccurate or negative durations when the system clock changes.

### Tracking boundary

- **Decision**: Use an application decorator around the existing crawler use case. Persist in a `finally`-style path, catch persistence errors, and preserve the exact core output or error.
- **Rationale**: Tracking remains orthogonal to crawling, and the decorator naturally sees both success and failure without changing the crawler implementation.
- **Alternatives considered**: Put tracking into the CLI, crawler core, or infrastructure source adapter. These either mix presentation/core concerns or fail to cover all use-case outcomes consistently.

### In-memory repository

- **Decision**: Implement only `save` and `getAll` over an in-memory list, returning records in insertion order and copying the list on retrieval.
- **Rationale**: This directly meets the current feature scope and prevents consumers from changing stored ordering.
- **Alternatives considered**: Add SQLite, cache, or file persistence. The spec explicitly defers persistent storage.

### CLI lifecycle limitation

- **Decision**: Keep one repository instance shared by commands in the composition root; each fresh CLI process begins with empty history.
- **Rationale**: The user confirmed this process-local behavior is intentional for this feature; a proper persistence mechanism will be implemented in a future feature.
- **Alternatives considered**: Add a daemon or cross-process transport so separate executable invocations share records. That would add unrequested infrastructure and violate the scaffold scope.

## Scope Notes

The project architecture document mentions a future SQLite usage repository and a richer record shape. This feature follows its own narrower spec: in-memory storage only and the four required fields. Any documentation change to describe the completed persistence roadmap should be handled separately if requested.
