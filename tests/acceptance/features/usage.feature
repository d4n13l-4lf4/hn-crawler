Feature: Persist and inspect crawler usage history
  As a user of the Hacker News Crawler
  I want usage history to survive CLI invocations and appear as an aligned table
  So that I can inspect recent crawler activity

  Scenario: Display no-option crawl usage as none across two CLI invocations
    Given a temporary usage database path is configured
    When I run the crawl command using the temporary usage database
    And I run the usage command using the same temporary usage database
    Then the usage command exits with code 0
    And the usage table contains the persisted crawl record
    And the applied filter is displayed as "none"
    And the usage table columns are aligned

  Scenario: Display filter and ranking usage labels for explicitly selected options
    Given a temporary usage database path is configured
    When I run the crawl command with title filter "le:5" and ranking "points" using the temporary usage database
    And I run the usage command using the same temporary usage database
    Then the usage command exits with code 0
    And the applied filter is displayed as "sort:number_of_points:desc,filter:title_words:le:5"

  Scenario: Display an empty usage table in a fresh database
    Given a temporary usage database path is configured
    When I run the usage command using the temporary usage database
    Then the usage command exits with code 0
    And the usage table has a heading and column headers but no records

  Scenario: Reject unsupported usage arguments
    Given a temporary usage database path is configured
    When I run the usage command with an unsupported argument
    Then the usage command exits with a non-zero code
