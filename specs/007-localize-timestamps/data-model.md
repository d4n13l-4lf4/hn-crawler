# Data Model: Localize Usage Timestamps

No persisted data or domain entities change.

## Usage timestamp

| Field               | Stored form           | Rule                                                 |
| ------------------- | --------------------- | ---------------------------------------------------- |
| `request_timestamp` | Unix milliseconds UTC | Remains unchanged in the usage entity and SQLite row |

## Displayed timestamp

The presentation layer derives `YYYY-MM-DD HH:mm:ss (TZ)` from the stored instant and displays it under the `Request Date and Time` table header. `TZ` is the system timezone abbreviation applicable at that instant. If local date/time and a useful abbreviation cannot both be determined, the presentation layer uses the UTC representation and `(UTC)`.
