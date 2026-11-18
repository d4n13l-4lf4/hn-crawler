# Feature Specification: Localize Usage Timestamps

**Feature Branch**: `007-localize-timestamps`
**Created**: 2026-11-18
**Status**: Draft
**Input**: User description: "Display request timestamps in the usage command using the system's local date, time, and timezone abbreviation, with UTC as the fallback when local date/time formatting cannot be determined reliably."

## User Scenarios & Testing

### User Story 1 - Read Usage Times in Local Time (Priority: P1)

As a CLI user, I want request timestamps displayed in my system's local time and timezone, so that I can understand when crawler activity happened without converting from UTC myself.

**Why this priority**: The usage table is intended for quick inspection; showing local time makes its timestamps immediately meaningful to the user.

**Independent Test**: Run `usage` with records containing known Unix millisecond timestamps under controlled UTC and non-UTC system timezones. Verify the displayed local date, time, and timezone abbreviation while confirming stored timestamps remain unchanged.

**Acceptance Scenarios**:

1. **Given** a usage record with a known UTC timestamp and a system timezone of UTC, **When** the user runs `usage`, **Then** the timestamp is shown as `YYYY-MM-DD HH:mm:ss (UTC)`.
2. **Given** a usage record with a known UTC timestamp and a system timezone of Central European Summer Time, **When** the user runs `usage`, **Then** it is converted to the corresponding local wall time and shown with the actual local timezone abbreviation (for example, `2026-11-18 19:13:00 (CEST)` when applicable to that timestamp and timezone).
3. **Given** a timestamp falls on a daylight-saving transition, **When** the user runs `usage`, **Then** the displayed local time and abbreviation reflect the system timezone rules for that specific timestamp.
4. **Given** the system cannot provide a reliable local date/time or timezone abbreviation, **When** the user runs `usage`, **Then** the timestamp is displayed in UTC.
5. **Given** usage history is empty, **When** the user runs `usage`, **Then** the table displays the `Request Date and Time` header, aligned layout, and existing empty-history behavior.

## Edge Cases

- A stored timestamp is zero or lies near a day, month, year, or daylight-saving boundary.
- The local timezone uses a non-hour offset.
- The platform does not provide a usable local timezone abbreviation; UTC fallback is used.
- Multiple timestamps format to different string lengths; the usage table columns remain aligned.
- Invalid date values are not expected because stored usage entities require a non-negative safe-integer Unix millisecond timestamp; if formatting still cannot produce a valid date, display the timestamp in UTC when valid, otherwise preserve the existing clear failure behavior rather than fabricating a local date.

## Requirements

### Functional Requirements

- **FR-001**: The `usage` command MUST display request timestamps as `YYYY-MM-DD HH:mm:ss (TZ)`, where the date, time, and timezone label reflect the system's local timezone for the timestamp.
- **FR-002**: Timestamps MUST be converted from their stored Unix millisecond UTC values; persisted values and database schema MUST remain unchanged.
- **FR-003**: Localized output MUST use the timezone abbreviation applicable to each timestamp, including changes caused by daylight-saving rules.
- **FR-004**: If local date/time or a suitable local timezone label cannot be determined, the command MUST display that timestamp in UTC, using the same output shape and the `UTC` label.
- **FR-005**: Timestamp localization MUST rename the timestamp column header to `Request Date and Time` and MUST preserve the table's other column order, escaping, alignment, empty-history output, and error and exit-status behavior.
- **FR-006**: The `usage` command MUST continue accepting no feature-specific options or arguments.

### Key Entities

- **Usage timestamp**: A non-negative integer count of milliseconds since the Unix epoch in UTC, persisted unchanged and localized only when displayed.
- **Displayed local timestamp**: A formatted view of a usage timestamp containing local calendar date, wall-clock time, and the timezone abbreviation applicable to that instant.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Given the same stored timestamp, usage output matches the expected local date, time, and timezone abbreviation for the system timezone configured during the test.
- **SC-002**: Timestamps at daylight-saving boundaries display the correct local time and abbreviation for their respective instants.
- **SC-003**: When local formatting cannot supply a valid timestamp or timezone label, output uses UTC and remains parseable in the documented format.
- **SC-004**: All usage table columns remain aligned for histories with varied timestamp string lengths; the timestamp column is headed `Request Date and Time`; and empty history retains its existing three table lines after the heading.
- **SC-005**: The stored timestamp returned from persistence is unchanged by display formatting.

## Assumptions

- The operating system's configured local timezone is the source of truth; users do not select a timezone through CLI arguments or environment configuration.
- Timezone abbreviations are platform/runtime-provided labels (such as `UTC`, `CET`, or `CEST`), not user-localized translations.
- UTC is the fallback whenever a valid local representation and timezone label cannot both be obtained.
- This feature changes only usage timestamp presentation; stored usage data and other table values remain unchanged.
