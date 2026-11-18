Feature: View crawler usage history
  As a user of the Hacker News Crawler
  I want to inspect usage records
  So that I can understand recent crawler activity

  Scenario: Show empty usage history in a fresh process
    When I run "hn-crawler usage" as a standalone command
    Then the usage command exits with code 0
    And the usage output is an empty JSON array

  Scenario: Show a JSON array with the usage record schema
    When I run "hn-crawler usage" as a standalone command
    Then the usage command exits with code 0
    And the usage output is a JSON array
    And the usage output contains the required public fields

  Scenario: Reject unsupported usage arguments
    When I run "hn-crawler usage --unknown" as a standalone command
    Then the usage command exits with a non-zero code

  Scenario: Start with empty history after process restart
    When I run "hn-crawler usage" as a standalone command
    Then the usage output is an empty JSON array
