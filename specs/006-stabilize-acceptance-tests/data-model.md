# Data Model: Stabilize Acceptance Tests

This feature adds no domain entities and makes no database schema changes.

## Database path configuration

| Value | Meaning | Selection rule |
|---|---|---|
| `HN_CRAWLER_DB_PATH` | Full SQLite database file path | Selected when present and non-empty |
| User data path | Existing cross-platform application data directory plus database filename | Selected when the explicit path is absent or empty |

The explicit path's parent directory is created before the database is opened, following the existing path helper behavior.

## Acceptance workflow path

The workflow generates a unique temporary file path for one run and supplies it to acceptance tests as `HN_CRAWLER_DB_PATH`. Acceptance scenarios and their spawned CLI processes share this path. It is test configuration, not a persisted domain record.
