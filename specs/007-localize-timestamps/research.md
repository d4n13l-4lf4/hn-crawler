# Research: Localize Usage Timestamps

## Decision: format timestamps in the presentation layer

- **Decision**: Convert the existing Unix-millisecond UTC value only while rendering the `usage` table.
- **Rationale**: Timezone conversion is a display concern. Keeping the raw value unchanged avoids migrations, entity changes, and altered semantics for stored records.
- **Alternatives considered**: Persisting localized text would make stored data depend on the environment where the crawl ran and would prevent users from displaying history in their current local timezone.

## Decision: use system timezone rules for each timestamp

- **Decision**: Determine local date, wall-clock time, and timezone abbreviation from the current system timezone for each timestamp instant.
- **Rationale**: This gives the user the system-configured view and applies daylight-saving rules to the historical instant rather than to today's offset.
- **Alternatives considered**: A fixed offset or the current timezone abbreviation can mislabel historical timestamps near daylight-saving transitions.

## Decision: UTC fallback when local output is incomplete

- **Decision**: If local date/time or a useful timezone abbreviation cannot be obtained, render the timestamp in UTC and label it `UTC`.
- **Rationale**: UTC is unambiguous and is the user-requested safe default.
- **Alternatives considered**: Printing an empty or generic timezone label fails the output contract; inventing an abbreviation is misleading.

## Decision: deterministic presentation tests

- **Decision**: Exercise known instants under explicit timezone settings, including both sides of a daylight-saving transition, and verify table alignment.
- **Rationale**: Tests must not inherit whichever timezone happens to be configured on the developer or CI machine.
- **Alternatives considered**: Testing only UTC would miss local conversion and daylight-saving regressions; asserting one ambient timezone would be flaky across runners.

## Decision: no new dependency or persistence change

- **Decision**: Use existing Node.js date/time formatting capabilities and leave the SQLite representation untouched.
- **Rationale**: The feature only needs a presentation format, and the project already targets Node.js 26.
- **Alternatives considered**: A date library adds dependency and surface area without a requirement for custom timezone selection or locale translation.
