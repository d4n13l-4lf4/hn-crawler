# Quickstart: CLI Usage and Filter Defaults

## Prerequisites

- Node version specified in `.nvmrc` and project dependencies installed.
- For manual acceptance validation, configure `HN_CRAWLER_ACCEPTANCE_URL` to a deterministic page containing up to 30 entries with varied titles and ranking metrics.

## Unit and quality validation

Run focused unit tests during each implementation milestone, then run the configured non-acceptance quality gates from `docs/QA.md` before marking a milestone green. The acceptance suite is intentionally not run during intermediate milestones.

## Manual acceptance validation (user-run at the end)

1. Build and install the local CLI according to `npm run test:acceptance:local` setup in `package.json`, with the user's deterministic URL configured.
2. Run the acceptance suite only after all implementation milestones are approved.
3. Confirm no-option results retain page order and usage displays `none`.
4. Confirm filter-only results retain the relative source order of matching entries.
5. Confirm ranking-only and combined requests behave as specified and usage strings retain `sort:` for ranking and use `filter:` for title rules.
6. Verify the package version through unit-level validation; no acceptance scenario is expected for it.
