Feature: Crawl Hacker News stories
  As a user of the Hacker News Crawler
  I want to crawl the top stories
  So that I can consume the current page as JSON

  Scenario: Crawl and rank the first 30 entries by comments
    Given the configured acceptance crawl URL is available
    When I run the crawl command with the configured URL and ranking "comments" in beta mode
    Then the crawl output is a JSON array with at most 30 entries
    And the crawl output should be ordered by comments descending
    And the crawl exit code should be 0

  Scenario: Apply the default long-title filter and comment ranking
    Given the configured acceptance crawl URL is available
    When I run the crawl command with default options and the configured URL in beta mode
    Then the crawl output should contain only titles with more than 5 words
    And the crawl output should be ordered by comments descending
    And every output entry should contain exactly the established story fields
    And the crawl exit code should be 0

  Scenario: Filter long titles and rank by comments
    Given the configured acceptance crawl URL is available
    When I run the crawl command with title filter "gt:5" and ranking "comments" using the configured URL in beta mode
    Then the crawl output should contain only titles with more than 5 words
    And the crawl output should be ordered by comments descending
    And the crawl exit code should be 0

  Scenario: Filter short titles and rank by points
    Given the configured acceptance crawl URL is available
    When I run the crawl command with title filter "le:5" and ranking "points" using the configured URL in beta mode
    Then the crawl output should contain only titles with at most 5 words
    And the crawl output should be ordered by points descending
    And the crawl exit code should be 0

  Scenario: Rank all retrieved titles by comments when no title filter is supplied
    Given the configured acceptance crawl URL is available
    When I run the crawl command with ranking "comments" and the configured URL in beta mode
    Then the crawl output should be ordered by comments descending
    And the crawl exit code should be 0

  Scenario: Rank all retrieved titles by points when no title filter is supplied
    Given the configured acceptance crawl URL is available
    When I run the crawl command with ranking "points" and the configured URL in beta mode
    Then the crawl output should be ordered by points descending
    And the crawl exit code should be 0

  Scenario: Reject both ranking options together
    When I run the crawl command with conflicting ranking options in beta mode
    Then I should see "The --top-comments and --top-points options cannot be used together." in the error output
    And the crawl exit code should be non-zero

  Scenario: Reject an invalid title-word limit
    When I run the crawl command with title filter "gt:10001" in beta mode
    Then I should see "The maximum value for the title words filter is 10000. Please use a value between 1 and 10000 (e.g., gt:100)." in the error output
    And the crawl exit code should be non-zero

  Scenario Outline: Reject malformed title-word filters
    When I run the crawl command with title filter "<filter>" in beta mode
    Then I should see "Invalid title words filter: <filter>" in the error output
    And the crawl exit code should be non-zero

    Examples:
      | filter |
      | gt:0   |
      | ge:5   |
      | gt:abc |

  Scenario: Report crawler failures with a non-zero exit status
    When I run the crawl command with an invalid URL in beta mode
    Then I should see "An error occurred while running the crawler. Please try again." in the error output
    And the crawl exit code should be non-zero

  Scenario: Beta URL option selects the configured page
    Given the configured acceptance crawl URL is available
    When I run the crawl command with the configured URL in beta mode
    Then the crawl output should be a JSON array
    And the crawl exit code should be 0

  Scenario: Production help does not expose the URL option
    When I run "hn-crawler crawl --help" in production mode
    Then I should not see "--url" in the output
    And the crawl exit code should be 0

  Scenario: Production rejects the beta-only URL option
    When I run "hn-crawler crawl --url https://example.invalid" in production mode
    Then I should see the standard CLI usage error in the error output
    And the crawl exit code should be non-zero
