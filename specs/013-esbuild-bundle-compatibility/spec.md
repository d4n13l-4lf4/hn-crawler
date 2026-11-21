# Feature Specification: Refactor for Esbuild Bundle Compatibility

**Feature Branch**: `feature/013-esbuild-bundle-compatibility`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Today, we are going to work on the next feature. The requirement goes like this:

We are going to implement some technical debt improvements.
We have implemented esbuild to generate a minified production bundle at dist/main.js.
The goal is to avoid breaking changes with this new functionality.
So, we need to refactor some code to avoid breaking changes with this new functionality.
The behavior will not change.

The technical solution will be provided in the plan.
So, acceptance tests won't change them. Will keep the functional behavior as the requirements establish right now.
No acceptance tests will be implemented or automatically run for this feature."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - CLI keeps working identically with bundled production binary (Priority: P1)

As a user of the Hacker News Crawler CLI, I want the installed `hn-crawler` command to behave exactly as before after the production bundle is generated with esbuild, so that my scripts and dashboards continue to work without any breaking changes.

**Why this priority**: Avoiding breaking changes is the sole purpose of this refactor; no user-facing change is intended.

**Independent Test**: Run the bundled production CLI (`dist/main.js`) and verify it produces identical command output, exit codes, and error handling as before for all existing crawl and usage subcommands.

**Acceptance Scenarios**:

1. **Given** the production bundle is generated at `dist/main.js`, **When** the user runs the CLI with any existing subcommand, **Then** the command behaves identically to before the bundle was introduced.
2. **Given** the production bundle runs successfully, **When** output is produced, **Then** entry fields, ordering, error messages, and exit codes are unchanged.
3. **Given** any command succeeds or fails, **When** the command executes, **Then** no new runtime errors are introduced by the bundle.

### Edge Cases

- The bundle is run from a different working directory; relative paths resolve correctly.
- Required configuration and static resources are available to the bundled binary.
- All CLI subcommands (crawl, usage) continue to function within the bundle.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI MUST continue to provide the same commands, options, and output as before the esbuild bundle was introduced.
- **FR-002**: The production bundle at `dist/main.js` MUST run without runtime errors introduced by bundling.
- **FR-003**: Command output fields, ordering, error handling, and exit codes MUST remain unchanged.
- **FR-004**: Existing acceptance tests MUST continue to pass with zero modifications.
- **FR-005**: No new user-facing options, commands, or behavioral changes are introduced.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The bundled production CLI runs all existing commands with output identical to pre-bundle behavior.
- **SC-002**: Every command exits with the same status codes as before the bundle was introduced.
- **SC-003**: All existing acceptance tests pass with zero modifications.
- **SC-004**: No user-facing options, commands, or behavioral changes are introduced.

## Assumptions

- The esbuild production bundle is generated at `dist/main.js` and serves as the CLI entry point.
- This is an internal refactor with no change to the CLI contract, output format, or external behavior.
- The existing acceptance suite remains the source of truth for correct behavior.
- The technical solution (how to refactor code to avoid breaking changes) will be defined in the plan phase.
- No new tests are written for this feature; existing tests validate the unchanged behavior.
