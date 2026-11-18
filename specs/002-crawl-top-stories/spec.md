# Feature Specification: Crawl Top Stories

**Feature Branch**: `feature/SC-001`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Expose a `crawl` CLI subcommand that displays the top 30 Hacker News entries as JSON, defaults to the Hacker News homepage, and supports an optional beta-only `--url` for acceptance testing. On failure, display a fixed error message and exit non-zero. No filtering, pagination, or usage statistics."

## Clarifications

### Session 2026-11-18

- Q: When a production user supplies the unsupported `--url` option, should the CLI show its standard usage error or the crawler error message? → A: Show the standard CLI usage error and exit non-zero.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Crawl Top Stories (Priority: P1)

As a user of the Hacker News Crawler, I want to run `hn-crawler crawl` and see the top 30 stories, so that I can retrieve the current front page in a predictable machine-readable format.

**Why this priority**: This is the core value of the feature and the sole user-facing workflow in scope.

**Independent Test**: Run the `crawl` command against a deterministic page containing stories and verify the displayed JSON contains the page's first 30 stories, with each story's rank, title, points, and comment count.

**Acceptance Scenarios**:

1. **Given** the CLI is installed and the Hacker News homepage is reachable, **When** the user runs `hn-crawler crawl` with no arguments or options, **Then** the command crawls `https://news.ycombinator.com/` and displays the first 30 entries as a JSON array.
2. **Given** a successful crawl returns entries, **When** the command displays them, **Then** each entry has exactly the fields `rank`, `title`, `points`, and `number_of_comments`, with rank reflecting its position from 1 through 30.
3. **Given** the requested page contains fewer than 30 entries, **When** the crawl succeeds, **Then** the command displays all available entries in page order.
4. **Given** the crawl cannot complete successfully, **When** the user runs `hn-crawler crawl`, **Then** the command displays `An error occurred while running the crawler. Please try again.` and exits with a non-zero status code.

### User Story 2 - Crawl a Specified Page in Beta (Priority: P2)

As a beta tester, I want to pass a page URL to the crawl command, so that acceptance checks can exercise deterministic pages without depending on the live Hacker News homepage.

**Why this priority**: A selectable source enables reliable beta acceptance testing while keeping the primary command simple for normal use.

**Independent Test**: In a beta release, run `hn-crawler crawl --url <page>` against a deterministic page and verify that the returned entries are displayed using the same output contract as the default crawl.

**Acceptance Scenarios**:

1. **Given** the CLI is a beta release and a valid page URL is supplied, **When** the user runs `hn-crawler crawl --url <page>`, **Then** the command crawls that page and displays its top entries in the standard JSON format.
2. **Given** the CLI is a production release, **When** the user requests help for `crawl`, **Then** `--url` is not exposed as an available option.
3. **Given** the CLI is a production release, **When** the user supplies `--url`, **Then** the CLI displays its standard usage error and exits with a non-zero status code.
4. **Given** a beta user supplies a URL that cannot be crawled, **When** the command fails, **Then** it displays the standard error message and exits with a non-zero status code.

### Edge Cases

- The requested page has fewer than 30 stories; display the stories available without fabricating entries.
- The requested page has no stories; display an empty JSON array as a successful result.
- The page request fails or its contents cannot be read as Hacker News entries; display the standard error message and exit non-zero.
- A production user supplies `--url`; display the standard CLI usage error and exit non-zero.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI MUST provide a `crawl` subcommand.
- **FR-002**: When no URL is supplied, the `crawl` command MUST retrieve entries from `https://news.ycombinator.com/`.
- **FR-003**: On success, the command MUST display a JSON array containing up to the first 30 entries from the requested page in page order.
- **FR-004**: Each displayed entry MUST contain exactly four properties: `rank`, `title`, `points`, and `number_of_comments`.
- **FR-005**: The rank MUST represent the entry's one-based position among entries retrieved from the page; missing point or comment values MUST be represented as zero.
- **FR-006**: A successful crawl with no entries MUST display an empty JSON array.
- **FR-007**: On any crawl error, the command MUST display exactly `An error occurred while running the crawler. Please try again.` and exit with a non-zero status code.
- **FR-008**: The CLI MUST expose the `--url` option only in beta releases.
- **FR-009**: In beta releases, `--url` MUST select the page crawled by the command.
- **FR-010**: In production releases, `--url` MUST not be listed as a supported `crawl` option; if supplied, the CLI MUST display its standard usage error and exit with a non-zero status code.
- **FR-011**: The crawl workflow MUST NOT apply title filtering, pagination, or collect usage statistics.

### Key Entities _(include if data involved)_

- **Story entry**: A single item on the requested Hacker News page, represented in command output by its rank, title, points, and number of comments.
- **Crawl request**: A request to retrieve the first page of stories from either the default Hacker News homepage or, in beta releases, a supplied page URL.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A successful default crawl displays up to 30 story entries from the Hacker News homepage in one valid JSON array.
- **SC-002**: Every displayed story has all four required properties, and its rank matches its one-based position in the displayed page order.
- **SC-003**: For a page with fewer than 30 entries, the output contains every available entry and no fabricated entries.
- **SC-004**: For every crawl failure, the specified error message is displayed and the process exits with a non-zero status code.
- **SC-005**: Beta testers can select a crawl page through `--url`, while production users cannot use or discover that option through command help.

## Assumptions

- The first 30 entries means the first 30 story items in the requested page's displayed order; no sorting or title-based filtering is performed.
- Missing points and comment counts are presented as zero.
- An empty page that can be read successfully is a successful crawl and produces `[]`.
- The beta deployment sets `HN_CRAWLER_BETA=true` to control whether `--url` is exposed.
- Acceptance checks can provide a deterministic page whose content represents the expected entry list.
- Usage statistics, filtering, and pagination remain outside this feature.
