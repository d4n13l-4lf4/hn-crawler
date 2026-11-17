Feature: Hello World CLI Command
  As a user of the Hacker News Crawler
  I want to run the CLI with no arguments
  So that I see the "Hello World" message

  Scenario: Default command outputs Hello World
    Given I have installed the hn-crawler CLI
    When I run "hn-crawler" with no arguments
    Then I should see "Hello World" in the output
    And the exit code should be 0

  Scenario: Help option displays usage information
    Given I have installed the hn-crawler CLI
    When I run "hn-crawler" with "--help"
    Then I should see "Usage: hn-crawler" in the output
    And the exit code should be 0
