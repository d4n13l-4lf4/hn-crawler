# Acceptance Environment Contract

## Database path

The CLI accepts `HN_CRAWLER_DB_PATH` as the full SQLite database file path. A non-empty value takes precedence over the normal user data location. If unset or empty, the CLI uses the normal per-user path.

The acceptance workflow generates a unique temporary file path before invoking the suite and exports it for the acceptance runner and every spawned `hn-crawler` process. Tests must not use or modify the normal user database when the override is set.

## Error assertions

- Commander-generated usage/option errors include the `error:` prefix and must exit non-zero.
- Crawl argument-validation failures must assert the error output appropriate to their current application contract and must exit non-zero.
- Successful commands must exit with status zero.

## Scenario inventory

Retain current crawl and usage scenarios. Remove the obsolete Hello World feature and its step definitions. Acceptance tests remain black-box subprocess tests of the installed CLI.

## Inputs kept unchanged

The workflow continues to validate and pass the repository-configured `HN_CRAWLER_ACCEPTANCE_URL` and set `HN_CRAWLER_BETA=true` as it does today.
