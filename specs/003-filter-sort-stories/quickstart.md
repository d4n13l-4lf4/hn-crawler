# Quickstart: Filter and Sort Hacker News Stories

## Prerequisites

- Node.js version pinned by `.nvmrc` and npm dependencies installed.
- A deterministic fixture page URL configured as `HN_CRAWLER_ACCEPTANCE_URL` for acceptance verification.
- Beta URL override enabled only in acceptance scenarios that exercise `--url`.

## Local quality validation

Run the project gates after each implementation milestone:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
```

Acceptance tests are intentionally left until the final reviewed milestone. When approved, run the documented local acceptance command with `HN_CRAWLER_ACCEPTANCE_URL` set in the environment:

```bash
HN_CRAWLER_ACCEPTANCE_URL="<deterministic-page-url>" HN_CRAWLER_BETA=true npm run test:acceptance:local
```

The command builds and installs the package locally before executing the black-box CLI acceptance suite. In CI, the acceptance workflow uses the published beta artifact and the repository-level URL configuration described by the existing workflow setup.

## Expected behavior checks

| Invocation                                           | Expected processing                                           |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `hn-crawler crawl`                                   | First up to 30 entries, then `gt:5`, then comments descending |
| `hn-crawler crawl --top-points`                      | All first up to 30 entries, points descending                 |
| `hn-crawler crawl --title-words le:5 --top-comments` | First up to 30 entries, then `le:5`, then comments descending |
| `hn-crawler crawl --title-words gt:5 --top-points`   | First up to 30 entries, then `gt:5`, then points descending   |

Success returns a JSON array with at most 30 objects and the established four fields. Failures return non-zero status; crawler failures use the existing generic message. See [CLI contract](contracts/crawl-cli.md) and [data model](data-model.md).
