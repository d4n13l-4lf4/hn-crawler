Feature: Persist and inspect crawler usage history
  As a user of the Hacker News Crawler
  I want usage history to survive CLI invocations and appear as an aligned table
  So that I can inspect recent crawler activity

  Scenario: Display persisted crawl usage across two CLI invocations
    Given a temporary usage database path is configured
    When I run the crawl command with the configured URL in beta mode using the temporary usage database
    And I run the usage command using the same temporary usage database
    Then the usage command exits with code 0
    And the usage table contains the persisted crawl record
    And the usage table columns are aligned

  Scenario: Display an empty usage table in a fresh database
    Given a temporary usage database path is configured
    When I run the usage command using the temporary usage database
    Then the usage command exits with code 0
    And the usage table has a heading and column headers but no records

  Scenario: Reject unsupported usage arguments
    Given a temporary usage database path is configured
    When I run the usage command with an unsupported argument
    Then the usage command exits with a non-zero code
