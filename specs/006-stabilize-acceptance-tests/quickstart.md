# Quickstart: Stabilize Acceptance Tests

## Non-acceptance validation during implementation

Run the project quality gates and build after implementation:

```bash
npm run quality
npm run build
```

Acceptance tests are intentionally not run during implementation. Inspect the workflow changes statically and leave the manual acceptance run to the user.

## Manual acceptance validation

After reviewing the implementation, configure the deterministic crawl URL and run the local acceptance suite using a fresh explicit DB file path. For example:

```bash
HN_CRAWLER_ACCEPTANCE_URL='<deterministic-page-url>' \
HN_CRAWLER_BETA=true \
HN_CRAWLER_DB_PATH="$(mktemp -d)/hn-crawler-usage-$$/usage.sqlite" \
npm run test:acceptance:local
```

Expected result: all current crawl and usage acceptance scenarios pass, the removed Hello World scenarios are absent, and usage data is written only to the configured temporary database file.

See [acceptance environment contract](contracts/acceptance-environment.md) and [data model](data-model.md).
