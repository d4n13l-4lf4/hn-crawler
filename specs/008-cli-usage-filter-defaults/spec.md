# Feature Specification: CLI Usage and Filter Defaults

**Feature Branch**: `[008-cli-usage-filter-defaults]`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Implement technical debt improvements: retrieve the CLI version dynamically from package.json for --version (without an acceptance scenario); change title-word applied-filter prefix from sort to filter (include acceptance refactor); and make a crawl with no options retrieve all 30 entries without sorting or filtering, recording and displaying the applied filter as none in usage."

## Clarifications

### Session 2026-11-19

- Q: If a crawl supplies only one filtering or sorting option, what should happen to the unspecified operation? → A: Apply only supplied operations; absent operations stay off.
- Q: What should usage show when a crawl selects ranking, with or without a title-word filter? → A: Keep sort labels for ranking and use filter labels for title rules; no options is `none`.
- Q: When a ranking option is supplied, should the result remain limited to 30 even though the crawler already retrieves at most 30 entries? → A: Yes; ranking reorders the retrieved entries and returns no more than 30.
- Q: Should a ranking-only crawl return all available first-30 entries ordered by the selected metric, with no title filter? → A: Yes; rank all retrieved entries.
- Q: For explicit `--title-words` without a ranking flag, should entries stay in page order or use the previous implicit comments ranking? → A: Keep page order; apply only the supplied filter.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Inspect Unmodified Crawl Results (Priority: P1)

As a crawler user, I want a crawl with no options to return the first 30 entries as provided by Hacker News, so that I can inspect the original results without an implicit filter or ranking.

**Why this priority**: A no-option crawl is the standard entry point and must reflect the user's explicit expectation of unmodified results.

**Independent Test**: Run the CLI against a deterministic page whose first 30 entries include different title lengths and metric values; verify all available entries up to 30 are returned in page order and the usage command reports `none` for that crawl.

**Acceptance Scenarios**:

1. **Given** a deterministic page with entries that would be excluded or reordered by title filtering or ranking, **When** the user runs `hn-crawler crawl` without options, **Then** the command returns the first 30 available entries (or fewer if fewer exist) in their original page order, with no title-word filtering or ranking applied.
2. **Given** a no-option crawl has completed, **When** the user runs the usage command, **Then** that crawl's applied filter is displayed as `none`.
3. **Given** the source page contains fewer than 30 entries, **When** the user runs a no-option crawl, **Then** all available entries are returned in their original page order.

---

### User Story 2 - Read Accurate Applied Filter Descriptions (Priority: P2)

As a user reviewing crawl history, I want each title-word filter description to use the `filter` prefix, so that usage records clearly identify a filter rather than a sort operation.

**Why this priority**: Correct usage descriptions make historical crawl behavior understandable and consistent with the operation performed.

**Independent Test**: Run crawls with both supported title-word comparators, inspect usage output, and verify filter descriptions use the `filter` prefix; verify acceptance coverage asserts the new format.

**Acceptance Scenarios**:

1. **Given** a crawl uses the title-word rule `le:5`, **When** its usage record is displayed, **Then** the applied filter is shown as `filter:title_words:le:5`.
2. **Given** a crawl uses the title-word rule `gt:5`, **When** its usage record is displayed, **Then** the applied filter uses the `filter:title_words:gt:5` format.
3. **Given** acceptance coverage verifies applied-filter output, **When** the expected format is updated, **Then** the acceptance scenarios check for the `filter` prefix and no longer expect `sort` for title-word filtering.

---

### User Story 3 - See the Package Version (Priority: P3)

As a CLI user, I want the version command to show the package's current version, so that the displayed version stays aligned with the published package metadata.

**Why this priority**: A reliable version display helps users identify the installed CLI release.

**Independent Test**: Change the package version in package metadata and verify the CLI version output reflects that value.

**Acceptance Scenarios**:

This requirement has no acceptance scenario, as requested. It is covered by functional and success criteria only.

### Edge Cases

- A no-option crawl returns fewer than 30 entries when the source page contains fewer than 30.
- An explicit filter or sorting option continues to apply the selected behavior; the `none` marker is reserved for a crawl with no options.
- A usage record from a no-option crawl displays `none` consistently in usage output.
- The package version is changed between releases; the version command must reflect the current package metadata without a separate hard-coded version update.
- Acceptance coverage for applied-filter strings must be refactored to assert the revised `filter` prefix.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI `--version` command MUST display the version currently declared in the package metadata.
- **FR-002**: A `crawl` invocation with no crawl options MUST retrieve up to the first 30 available entries without title-word filtering or ranking and preserve source order.
- **FR-003**: A no-option crawl MUST record its applied filter as `none`.
- **FR-004**: The usage command MUST display `none` for a no-option crawl's applied filter.
- **FR-005**: Usage descriptions for title-word filters MUST use the `filter` prefix, with `filter:title_words:<comparator>:<limit>` as the format (for example, `filter:title_words:le:5`).
- **FR-006**: Acceptance coverage for title-word applied-filter descriptions MUST be updated to expect the `filter` prefix rather than `sort`.
- **FR-007**: When explicit crawl options are provided, the command MUST continue to apply the requested filtering and/or ranking behavior and describe the applied filter according to that behavior.
- **FR-008**: When only one type of filtering or sorting option is supplied, the command MUST apply only the supplied operation; it MUST NOT apply an implicit default for the unspecified operation.
- **FR-009**: Usage descriptions MUST continue to identify selected ranking with the existing `sort:<metric>:desc` label, while title-word rules use the `filter:title_words:<comparator>:<limit>` label; a crawl with neither selection MUST use `none`.
- **FR-010**: Ranking, when explicitly requested, MUST reorder only the retrieved first 30 entries in descending order by the selected metric and MUST return no more than 30 entries.
- **FR-011**: When a ranking option is supplied without a title-word filter, the command MUST rank all retrieved entries without applying a title-word filter.
- **FR-012**: When a title-word filter is supplied without a ranking option, the command MUST preserve the source order of matching entries.

### Key Entities

- **Crawl usage record**: A record of a crawl including its applied-filter description; the description is `none` when no filter or sorting option was selected.
- **Title-word filter description**: A human-readable description of the comparator and word-count limit using the `filter:title_words:<comparator>:<limit>` form.
- **Package version**: The release version declared by the CLI package and shown to the user by the version command.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In deterministic no-option crawls, 100% of available entries among the first 30 are returned in source order without filtering or ranking.
- **SC-002**: 100% of usage output for no-option crawls displays the applied filter as `none`.
- **SC-003**: Usage output for each supported title-word comparator uses the `filter:title_words` prefix and the selected comparator and limit.
- **SC-004**: The displayed CLI version matches the version declared in package metadata after a version change, without changing a separate version literal.
- **SC-005**: Acceptance checks for title-word usage descriptions verify the `filter` prefix and do not rely on the prior `sort` prefix.

## Assumptions

- “No option” means no crawl filtering or ranking options were supplied; operational options such as a source URL do not count as a filter or sorting option.
- Existing explicit title-word filters and ranking options retain their established semantics.
- When a crawl supplies only a title-word filter, entries are not ranked; when it supplies only a ranking option, no title-word filter is applied.
- “First 30 entries” uses the same candidate set available to the crawler, and fewer than 30 available entries are returned as-is.
- When ranking is selected, entries with equal metric values retain their original page order, and missing metric values count as zero.
- The package metadata is the authoritative source for the CLI version.
