# Quickstart: Validate Crawl Top Stories Refinements

Acceptance tests are not to be run locally during this feature. This guide documents the future local invocation and the CI environment contract so it can be used when the user is ready to review acceptance behavior.

## Prerequisites

- Node.js version from `.nvmrc` (Node 26)
- Dependencies installed with `npm ci`
- Existing parser reference: `tests/resources/hacker-news.html`
- A manually configured repository-level GitHub Actions variable named `HN_CRAWLER_ACCEPTANCE_URL`, containing a deterministic URL that serves the expected Hacker News HTML

## Local acceptance command (prepared, do not run for this feature)

When local acceptance testing is later authorized, set the URL in the shell and enable the beta URL option:

```bash
HN_CRAWLER_ACCEPTANCE_URL='<fixture URL>' HN_CRAWLER_BETA=true npm run test:acceptance:local
```

Acceptance steps should fail before invoking the CLI if `HN_CRAWLER_ACCEPTANCE_URL` is unset or empty. They should pass its value as `--url`; they must not silently default to the live Hacker News site.

## CI acceptance flow

The existing `acceptance-tests` workflow runs after successful beta publication in the same repository. It maps repository configuration explicitly into the acceptance process:

```yaml
env:
  HN_CRAWLER_ACCEPTANCE_URL: ${{ vars.HN_CRAWLER_ACCEPTANCE_URL }}
  HN_CRAWLER_BETA: 'true'
```

The user must create the Actions repository variable manually. The workflow includes a preflight that fails with a clear message when it is empty, before running `npm run test:acceptance`. The beta release workflow does not need the fixture URL. GitHub Actions does not automatically turn repository variables into environment variables; the explicit `vars` mapping is required.

## Unit and non-acceptance checks by milestone

1. **Acceptance URL wiring**: review step configuration and workflow mapping; do not execute acceptance tests. The configured page is used for the 30-entry/output and beta URL scenarios. Failure behavior uses an invalid URL; empty/fewer-than-30 pages remain covered by parser unit tests.
2. **Config injection**: test that `newsCombinatorUrl` is injected from `src/config/config.ts`, with a beta URL overriding it.
3. **HTTP cause chaining**: assert a network failure is contextualized and the original error is available as `cause`.
4. **Import alias**: run build, formatter, lint, typecheck, and unit coverage after alias changes.
5. **Value objects**: table-test `Title` and `Numeric`, entity values, parser extraction/defaults, and primitive JSON serialization. Confirm the first fixture entry remains rank 1, title `Java4Shell: RCE in OpenJDK when processing Base64`, points 795, comments 211.
6. **Task reconciliation**: confirm the task list distinguishes acceptance harness review from acceptance execution and keeps execution unchecked.

Run non-acceptance quality checks as appropriate for each approved implementation milestone. Do not run `npm run test:acceptance`, `npm run test:acceptance:local`, or another acceptance command locally for this feature.

## Expected outcomes

- `hn-crawler crawl` emits up to 30 ordered entries in the established JSON shape.
- The configured default URL is owned by `src/config/config.ts`, not hardcoded in the use case.
- Missing title values become `''`; missing, unmatched, invalid, or NaN numeric values become `0` through domain value objects.
- The parser captures source text best-effort and leaves normalization to the domain.
- The CI acceptance process receives the manually configured `HN_CRAWLER_ACCEPTANCE_URL` and sets `HN_CRAWLER_BETA=true`.
- Acceptance execution remains pending explicit user review/direction.

See [CLI contract](contracts/cli.md) and [data model](data-model.md) for the public output and domain value rules.
