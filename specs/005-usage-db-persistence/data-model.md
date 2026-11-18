# Data Model: Persist Usage History

## Usage record

The persisted record retains the existing public fields:

| Field               | Type                          | Required | Rule                                                          |
| ------------------- | ----------------------------- | -------: | ------------------------------------------------------------- |
| `request_id`        | UUIDv7 text                   |      Yes | Primary identity; displayed as the table's `ID`               |
| `request_timestamp` | Integer Unix milliseconds UTC |      Yes | Captured at crawl request start                               |
| `applied_filters`   | Text                          |      Yes | Existing canonical sort and optional title filter description |
| `duration_ms`       | Non-negative integer          |      Yes | Monotonic elapsed milliseconds                                |

No separate database-generated identity is required.

## Usage history

The database stores records in insertion order. A database insertion sequence is used to break timestamp ties and determine which records are newest. Reads return records in request insertion order.

## Retention configuration

A positive integer supplied through application configuration controls maximum retained records. The default is 100. Each save and pruning operation is atomic. On configuration reduction, the next save leaves no more than the newly configured limit.

## Database lifecycle

The database is a local SQLite file under the `hn-crawler` user data directory. Startup migrations create or upgrade the schema before CLI command dispatch. Tests may override the database path to a shared temporary file across subprocess invocations.
