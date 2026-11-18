# Implementation Plan: Localize Usage Timestamps

**Branch**: `007-localize-timestamps` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification for displaying usage request timestamps in local time with a UTC fallback.

## Summary

Format `Usage.request_timestamp` only when rendering the usage table in the presentation layer. Convert its Unix milliseconds to the system-local calendar date/time and timezone abbreviation for that specific instant, and rename the timestamp column header to `Request Date and Time`. If local formatting or a useful timezone abbreviation cannot be produced, format the same instant in UTC. Keep the persisted timestamp, domain entity, application use case, and database schema unchanged.

## Technical Context

**Language/Version**: TypeScript, Node.js 26
**Primary Dependencies**: Existing Node.js internationalization/date APIs, Commander, Vitest
**Storage**: Existing SQLite usage records remain unchanged; timestamps stay Unix milliseconds UTC
**Testing**: Vitest unit tests for the usage presentation formatter and CLI output, plus a Cucumber acceptance-test refactor for the usage table contract. The user will run acceptance tests manually after implementation; the implementation workflow must not run them.
**Target Platform**: Node.js CLI on supported operating systems with runtime locale/timezone data
**Project Type**: Standalone TypeScript CLI
**Performance Goals**: Formatting is local to each displayed usage record and adds no material latency to usage history output
**Constraints**: Changes must remain in the presentation layer; no domain, application, infrastructure, persistence, database-schema, or CLI option changes. Display format is `YYYY-MM-DD HH:mm:ss (TZ)`. Use the system timezone and its applicable abbreviation; fall back to UTC if a valid local date/time and timezone label cannot both be obtained.
**Scale/Scope**: At most the configured usage history limit (default 100) is formatted per invocation; table structure and stored data are unchanged

## Constitution Check

| Principle                             | Status | Evidence                                                                                                                            |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Hexagonal Architecture with Light DDD | PASS   | Timestamp conversion is display formatting in `src/presentation/cli/usage.ts`; no inner layer gains presentation-specific behavior. |
| Test-First Development                | PASS   | Add formatter-focused tests before implementation, then run all unit quality gates.                                                 |
| Pipes and Filters with Pure Functions | PASS   | The change is a deterministic display transformation and does not alter crawler pipelines.                                          |
| Simplicity and YAGNI                  | PASS   | Use existing runtime date/time support; add no dependency, layer, or abstraction unless tests require a small private helper.       |
| Deterministic Domain Rules            | PASS   | The stored UTC timestamp remains authoritative; its display reflects the system timezone and timezone rules at that instant.        |

## Design Decisions

### Presentation-only timestamp formatting

- Add a private timestamp-formatting helper in `src/presentation/cli/usage.ts` or a small presentation-local utility only if separation improves testability without adding an unnecessary layer.
- Format year, month, day, hour, minute, and second with two-digit padding where required, then append the runtime-provided timezone abbreviation in parentheses.
- Use the local representation for each timestamp independently so daylight-saving changes are handled based on the instant, not the current date.
- Reject missing, generic, or otherwise unusable timezone labels for local output and fall back to a UTC-formatted timestamp with `(UTC)`.
- If the timestamp cannot form a valid date in either mode, retain the existing command-level error behavior rather than showing a fabricated date.
- Do not mutate `Usage`, alter the numeric timestamp in storage, or introduce a timezone option/configuration value.

### Test strategy

- Extend `tests/unit/presentation/cli/usage.test.ts` with table-driven cases for UTC, non-UTC offsets, daylight-saving transitions, UTC fallback, and alignment when localized timestamp lengths differ.
- Make timezone-dependent tests deterministic by setting the process timezone for the test process or by testing a presentation-local formatter with an injected timezone only if an injection can remain private to presentation. Avoid relying on the developer's ambient timezone.
- Update the expected timestamp header to `Request Date and Time`; preserve the other output assertions for empty history, column order, escaping, command arguments, error handling, and exit status.
- Run the targeted usage test, `npm run quality`, and `npm run build`. Update acceptance assertions for the new usage table timestamp contract, but leave the acceptance test run to the user for manual verification.

## Incremental Review Milestones

1. **Localized timestamp and header coverage**: Add table-driven tests for UTC, a non-UTC timezone, daylight-saving changes, fallback, the `Request Date and Time` header, and table alignment in `tests/unit/presentation/cli/usage.test.ts`. Run the targeted unit test to demonstrate the expected failures; pause for review.
2. **Presentation formatter and header**: Implement the local timestamp formatting, UTC fallback, and `Request Date and Time` header in `src/presentation/cli/usage.ts`, leaving storage and all other layers untouched. Run focused usage unit tests and formatting/lint/typecheck; pause for review.
3. **Final presentation verification**: Run `npm run quality` and `npm run build`, inspect changed paths to confirm the production implementation remains presentation-only, and pause for review.

## Appended Milestone: Acceptance Test Contract Refactor

The existing usage acceptance steps assert the obsolete `Request Timestamp` header, so they would fail against the implemented `Request Date and Time` output. Keep the acceptance scenarios black-box: launch the installed CLI and assert its visible table output without importing source artifacts or calling presentation internals.

- Update `tests/acceptance/steps/usage.steps.ts` to assert the `Request Date and Time` header in both persisted-record and empty-history scenarios.
- Add acceptance assertions for the documented local timestamp shape (`YYYY-MM-DD HH:mm:ss (TZ)`) while allowing the timezone abbreviation supplied by the host runtime. The test should validate a date/time value and a non-empty parenthesized timezone label rather than hard-code the runner's timezone.
- Preserve the existing check that the usage table columns align, and ensure the longer header/formatted timestamp is included in that check.
- Do not change acceptance workflow configuration unless required by the acceptance test command's current CI setup; no new timezone environment variable is introduced by this feature.
- Run unit tests, `npm run quality`, and `npm run build` during implementation. Do not run `npm run test:acceptance`; the user will run it manually to confirm the acceptance suite is green.

### Acceptance Refactor Review Milestone

1. Update the usage acceptance assertions to the localized timestamp and renamed header contract, run non-acceptance quality gates and build, inspect the black-box test diff, then pause for user review. The user subsequently runs acceptance tests manually.

## Project Structure

```text
src/presentation/cli/usage.ts
tests/unit/presentation/cli/usage.test.ts
```

**Structure Decision**: The existing CLI renderer owns the display format. Its existing unit test file is the only planned test surface. No persistence, application, domain, infrastructure, configuration, or workflow files are in scope.

## Complexity Tracking

No constitution violations or additional abstractions are proposed.
