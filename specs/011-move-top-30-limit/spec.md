# Feature Specification: Move Top-30 Limit to HN Adapter

**Feature Branch**: `feature/011-move-top-30-limit`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Today, we are going to work on the next feature. The requirement goes like this:

We are going to implement some technical debt improvements.
We are going to refactor the code without affecting any current functional behavior. The goal is to improve maintainability and readability. Also, align with Single Responsibility principles.
So, we are going to move intelligently the feature of limiting the output to top 30 stories from the use case to the hn adapter.
The technical solution will be provided in the plan.
So, acceptance tests won't change and we will keep the functional behavior as the requirements establish right now.
No acceptance tests will be implemented or automatically run for this feature."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Crawl output stays limited to top 30 stories (Priority: P1)

As a user of the Hacker News Crawler, I want the `crawl` command to keep returning at most the first 30 stories from the requested page, exactly as before, so that my scripts and dashboards continue to receive predictable output after internal code changes.

**Why this priority**: Preserving existing behavior is the sole purpose of this refactor; no user-facing change is intended.

**Independent Test**: Run the existing crawl acceptance scenarios against a deterministic page and verify the displayed JSON still contains at most 30 entries in page order, with identical fields and ranking.

**Acceptance Scenarios**:

1. **Given** a page containing more than 30 entries, **When** the user runs `hn-crawler crawl`, **Then** the command displays at most 30 entries in page order with no change to output format.
2. **Given** a page containing fewer than 30 entries, **When** the command succeeds, **Then** all available entries are displayed.
3. **Given** any crawl succeeds or fails, **When** output is produced, **Then** entry fields, ranking, title filtering, ties handling, missing-data behavior, and error messages are identical to the behavior before this refactor.

### Edge Cases

- The page contains exactly 30 entries; all 30 are displayed.
- The page contains no stories; an empty JSON array is displayed as a successful result.
- The page request fails; the standard error message is displayed and the command exits non-zero.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST continue to return at most 30 entries from the requested page, preserving the first-30-in-page-order candidate set.
- **FR-002**: The responsibility for limiting the candidate set to 30 entries MUST move from the crawl use case to the HN adapter (entry source).
- **FR-003**: The crawl use case MUST process every entry yielded by the entry source and MUST NOT impose its own entry count limit.
- **FR-004**: Entry output fields (rank, title, points, number of comments), sorting, title filtering, ties handling, and missing-data behavior MUST remain unchanged.
- **FR-005**: Every existing acceptance scenario MUST continue to pass without modification.
- **FR-006**: No new acceptance tests are required or added for this change.

### Key Entities _(include if data involved)_

- **Story entry**: A single Hacker News item identified by rank, title, points, and number of comments.
- **Candidate set**: The first entries retrieved from the requested page, limited to 30, on which filtering and ranking are applied.
- **Crawl request**: A request to retrieve entries from the default Hacker News homepage or, in beta releases, a supplied page URL.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A successful crawl displays up to 30 story entries in page order, with output identical to the pre-refactor behavior.
- **SC-002**: For every page size (zero, fewer than 30, exactly 30, more than 30 entries), the displayed entries match the pre-refactor output exactly.
- **SC-003**: All existing acceptance tests pass with zero modifications.
- **SC-004**: The refactor introduces no new user-facing options, commands, or behavioral changes.

## Assumptions

- This is an internal refactor with no change to the CLI contract, output format, or external behavior.
- The existing acceptance suite remains the source of truth for correct behavior.
- The technical solution (how the limit moves to the adapter) will be defined in the plan phase.
- No new tests are written for this feature; existing tests validate the unchanged behavior.
