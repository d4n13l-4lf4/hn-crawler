Feature: Crawl Hacker News stories
  As a user of the Hacker News Crawler
  I want to crawl the top stories
  So that I can consume the current page as JSON

  Scenario: Crawl the first page and display up to 30 results
    Given the local Hacker News page is available as a crawl source
    When I run "hn-crawler crawl" with the local page URL in beta mode
    Then the crawl output is a JSON array with 30 entries in page order
    And the first entry is rank 1 titled "Java4Shell: RCE in OpenJDK when processing Base64" with 795 points and 211 comments
    And the exit code should be 0

  Scenario: Crawl a page with fewer than 30 entries
    Given a local page with 2 Hacker News story entries is available
    When I run "hn-crawler crawl" with the local page URL in beta mode
    Then the crawl output is a JSON array with 2 entries in page order
    And the exit code should be 0

  Scenario: Crawl a page with no story entries
    Given a local page with no Hacker News story entries is available
    When I run "hn-crawler crawl" with the local page URL in beta mode
    Then the crawl output is an empty JSON array
    And the exit code should be 0

  Scenario: Report a crawl failure
    Given the local crawl source returns an HTTP error
    When I run "hn-crawler crawl" with the local page URL in beta mode
    Then I should see "An error occurred while running the crawler. Please try again." in the error output
    And the exit code should be non-zero

  Scenario: Beta URL option selects the requested page
    Given the local Hacker News page is available as a crawl source
    When I run "hn-crawler crawl" with the local page URL in beta mode
    Then the first entry title is "Java4Shell: RCE in OpenJDK when processing Base64"
    And the exit code should be 0

  Scenario: Production help does not expose the URL option
    When I run "hn-crawler crawl --help" in production mode
    Then I should not see "--url" in the output
    And the exit code should be 0

  Scenario: Production rejects the beta-only URL option
    When I run "hn-crawler crawl --url http://127.0.0.1:1" in production mode
    Then I should see the standard CLI usage error in the error output
    And the exit code should be non-zero
