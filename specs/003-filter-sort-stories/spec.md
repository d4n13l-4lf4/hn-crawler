# Feature Specification: Filter and Sort Hacker News Stories

## Clarifications

### Session 2026-11-18

- Q: Should filtering and sorting use only the already-fetched first 30 stories, or all stories available on the page before returning up to 30? → A: Use the first 30 retrieved stories as the candidate set, then filter and sort them; retrieve as many as available when the page contains fewer than 30.
- Q: May users combine either title filter with either ranking option, or must long titles use comments and short titles use points? → A: Allow any filter/ranking combination in this feature; evolve the architecture guideline later to match the completed implementation.

**Feature Branch**: `feature/filter-sort-stories`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Allow the crawler command to filter stories by title word count and sort by comments or points, using a default of more-than-five-word titles sorted by comments. Also fix acceptance checks so CLI errors are verified to return a non-zero process status."

## User Scenarios & Testing

### User Story 1 - Filter and Sort Stories (Priority: P1)

As a crawler user, I want to select a title word-count rule and a ranking metric, so that I can retrieve the top 30 Hacker News stories that match my interests.

**Why this priority**: Filtering and ranking are the primary value of this feature and extend the existing crawl command.

**Independent Test**: Run the standalone CLI against a deterministic page containing stories with varied title word counts, points, and comment counts. Check the JSON output contains only qualifying stories, sorted by the selected metric, capped at 30, with the existing four-field entry shape.

**Acceptance Scenarios**:

1. **Given** a page with titles on both sides of five words and varied comment counts, **When** the user runs `hn-crawler crawl --title-words gt:5 --top-comments`, **Then** the output contains only titles with more than five words, ordered by comments descending, up to 30 entries.
2. **Given** a page with titles on both sides of five words and varied point counts, **When** the user runs `hn-crawler crawl --title-words le:5 --top-points`, **Then** the output contains only titles with five or fewer words, ordered by points descending, up to 30 entries.
3. **Given** a deterministic page with stories, **When** the user runs `hn-crawler crawl` with no filtering or sorting options, **Then** the command behaves as `--title-words gt:5 --top-comments` and returns up to 30 qualifying stories in comment-descending order.
4. **Given** a deterministic page with varied stories, **When** the user supplies only `--top-comments`, **Then** all stories are eligible and output is ordered by comments descending.
5. **Given** a deterministic page with varied stories, **When** the user supplies only `--top-points`, **Then** all stories are eligible and output is ordered by points descending.
6. **Given** a deterministic page with varied stories, **When** the user supplies only `--title-words gt:5`, **Then** only titles longer than five words are returned and the default ranking is comments descending.
7. **Given** a deterministic page with varied stories, **When** the user supplies only `--title-words le:5`, **Then** only titles of five words or fewer are returned and the default ranking is comments descending.
8. **Given** both ranking options are supplied, **When** the command is run, **Then** the command reports an argument error and exits with a non-zero status.
9. **Given** a title-word filter using a count greater than 10000, **When** the command is run, **Then** it displays `The maximum value for the title words filter is 10000. Please use a value between 1 and 10000 (e.g., gt:100).` and exits with a non-zero status.
10. **Given** a title-word filter using a count below 1 or a comparator other than `gt` or `le`, **When** the command is run, **Then** it reports an argument error and exits with a non-zero status.
11. **Given** the crawl, filtering, or sorting operation fails, **When** the command is run, **Then** it displays `An error occurred while running the crawler. Please try again.` and exits with a non-zero status.

### User Story 2 - Trust CLI Acceptance Results (Priority: P2)

As a maintainer, I want acceptance checks to assert the actual process exit status for failures, so that a printed error cannot incorrectly appear as a successful command execution.

**Why this priority**: Reliable black-box acceptance checks are necessary to prevent regressions in the command's error contract.

**Independent Test**: Run the standalone CLI with a deterministic input that causes a command error and verify the exact error behavior and non-zero process exit status. Run a successful command and verify status zero.

**Acceptance Scenarios**:

1. **Given** a crawl command encounters a handled error, **When** the standalone CLI process exits, **Then** the process status is non-zero and the expected error message is present on standard error.
2. **Given** the command completes successfully, **When** the standalone CLI process exits, **Then** the process status is zero.
3. **Given** an acceptance scenario expects a failing command, **When** its step reports the result, **Then** it asserts both the expected error output and non-zero process status.

## Edge Cases

- Titles with exactly five counted words qualify for `le:5` and do not qualify for `gt:5`.
- Punctuation-only tokens do not count as words; a hyphenated word counts as one spaced word. For example, “This is - a self-explained example” has five words.
- Missing points or comments count as zero for ordering.
- Ties in the selected ranking metric retain original Hacker News page order.
- A valid filter that matches no stories returns `[]` successfully.
- The result contains no more than 30 entries after filtering and sorting.
- Values 1 and 10000 are valid title-word limits; values 0 and 10001 are invalid.
- Supplying both ranking options is invalid; supplying neither uses the default comment ranking.

## Requirements

### Functional Requirements

- **FR-001**: The existing `crawl` command MUST accept `--top-comments` to sort eligible stories by comment count in descending order.
- **FR-002**: The existing `crawl` command MUST accept `--top-points` to sort eligible stories by points in descending order.
- **FR-003**: The command MUST reject invocation with both `--top-comments` and `--top-points`.
- **FR-004**: The command MUST accept `--title-words gt:N` to retain stories whose title word count is greater than N.
- **FR-005**: The command MUST accept `--title-words le:N` to retain stories whose title word count is less than or equal to N.
- **FR-006**: The value N MUST be an integer from 1 through 10000 inclusive. Values above 10000 MUST display the specified friendly maximum-value message and exit non-zero; values below 1, non-integers, or unsupported comparators MUST produce an argument error and exit non-zero.
- **FR-007**: When `--top-comments` and `--top-points` are both absent, the command MUST sort by comments descending.
- **FR-008**: When `--title-words` is absent, the command MUST apply the default filter `gt:5`.
- **FR-009**: The default command with no options MUST behave as `--top-comments --title-words gt:5`.
- **FR-010**: Options MUST be independently combinable: either ranking option may be used with either title-word filter; a ranking option may be used without a title filter; and either title filter may use the default comment ordering.
- **FR-011**: The command MUST retrieve up to the first 30 stories available from the page, then filter those retrieved stories before ranking them, and return at most 30 stories after filtering and sorting.
- **FR-012**: Word count MUST use whitespace-separated words containing at least one letter or digit; punctuation-only tokens are excluded and internal punctuation in a token does not split it.
- **FR-013**: Missing points or comments MUST be treated as zero. Ties MUST retain source page order.
- **FR-014**: Successful output MUST remain a JSON array whose entries have exactly `rank`, `title`, `points`, and `number_of_comments`.
- **FR-015**: Crawl, filtering, sorting, and command argument errors MUST result in a non-zero process status. Crawl operation failures MUST use the existing message `An error occurred while running the crawler. Please try again.`
- **FR-016**: Acceptance checks for command failures MUST assert the process exits non-zero, in addition to checking expected error output. Acceptance scenarios MUST treat the CLI as a standalone black box and MUST NOT depend on source artifact paths.
- **FR-017**: This feature MUST NOT add usage statistics, pagination, or other crawl processing beyond the specified filter and sort operations.

### Key Entities

- **Story entry**: A Hacker News item with rank, title, points, and number of comments; the existing JSON representation remains unchanged.
- **Title word rule**: A comparator (`gt` or `le`) and an integer limit from 1 to 10000.
- **Ranking choice**: Comments descending or points descending, with comments descending as the default.

## Success Criteria

### Measurable Outcomes

- **SC-001**: For deterministic input, each supported filter/ranking combination returns exactly the entries satisfying the selected title rule and orders them by the selected metric.
- **SC-002**: With no options, the result is equivalent to applying `gt:5` and comments-descending ranking.
- **SC-003**: Every successful result has no more than 30 entries and each entry retains exactly the four established JSON fields.
- **SC-004**: Limits 1 and 10000 are accepted; 0, values above 10000, non-integers, and unsupported comparators fail with the specified error behavior.
- **SC-005**: Every handled command failure returns a non-zero process status, while successful commands return zero.
- **SC-006**: Word-count examples distinguish punctuation-only tokens from words and count “This is - a self-explained example” as five words.

## Assumptions

- `--title-words` takes one argument in the form `gt:N` or `le:N`, where N is a base-10 integer.
- When the title filter is supplied without a ranking option, comment-descending ranking remains the default.
- When a ranking option is supplied without a title filter, all crawled entries are eligible.
- A tie in sorting preserves the relative order from the page.
- Existing crawl URL selection and beta-only `--url` behavior remain unchanged.
- The command retrieves up to the first 30 available entries as its candidate set (making a best effort when fewer than 30 are present); filtering and sorting operate only on those retrieved entries.
- The acceptance tests may use deterministic externally configured URLs as established by the prior feature, but assertions interact only with the installed/runnable CLI process and its streams/status.
- Usage statistics remain outside this feature.
