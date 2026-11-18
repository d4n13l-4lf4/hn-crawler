Feature: Crawl Hacker News stories
  As a user of the Hacker News Crawler
  I want to crawl the top stories
  So that I can consume the current page as JSON

  Scenario: Crawl the first page and display up to 30 results
    Given the configured acceptance crawl URL is available
    When I run the crawl command with the configured URL in beta mode
    Then the crawl output is a JSON array with 30 entries in page order
    And the first entry is rank 1 titled "Java4Shell: RCE in OpenJDK when processing Base64" with 795 points and 211 comments
    And the crawl exit code should be 0

  Scenario: Beta URL option selects the configured page
    Given the configured acceptance crawl URL is available
    When I run the crawl command with the configured URL in beta mode
    Then the first entry title is "Java4Shell: RCE in OpenJDK when processing Base64"
    And the crawl exit code should be 0

  Scenario: Report a crawl failure
    Given the configured acceptance crawl URL is available
    When I run "hn-crawler crawl --url https://" in beta mode
    Then I should see "An error occurred while running the crawler. Please try again." in the error output
    And the crawl exit code should be non-zero

  Scenario: Production help does not expose the URL option
    When I run "hn-crawler crawl --help" in production mode
    Then I should not see "--url" in the output
    And the crawl exit code should be 0

  Scenario: Production rejects the beta-only URL option
    When I run "hn-crawler crawl --url https://example.invalid" in production mode
    Then I should see the standard CLI usage error in the error output
    And the crawl exit code should be non-zero
