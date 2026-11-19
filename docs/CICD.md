# CI/CD

> References: `QA.md` (quality gates and acceptance tests) · `ARCHITECTURE.md` (build and technologies)

## Branching (gitflow)

| Branch       | Purpose                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `main`       | Production.                                                              |
| `release/**` | An epic. Accumulates features and publishes betas.                       |
| `feature/**` | Incremental user-story changes, merged into a `release/**` branch by PR. |

Flow: `feature/**` → PR → `release/**` → PR → `main`.

## Versioning

- Semver. `package.json` is the authoritative version source for the CLI `--version` output and production publishing. The version is bumped on the `release/**` branch.
- **Beta:** `<package.json version>-beta.<run number>-<run attempt>-sha<7-character commit SHA>`, for example `1.2.0-beta.42-1-sha1a2b3c`. It is unique per workflow run and attempt, and it is published under the `beta` npm tag.
- **Production:** publish the `package.json` version as public under `latest`.

## Local development

- Feature branches are tested locally using the scripts described in `QA.md`.
- A Husky pre-commit hook runs `npm run quality` from `QA.md`. Acceptance tests run separately and are not part of this hook.

## Workflows

All workflows use the Node version from `.nvmrc`.

| Workflow           | Trigger                                             | Condition                | Jobs                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci`               | PR opened or updated against `release/**` or `main` | none                     | Run the quality gates from `QA.md`. This validates `feature/**` and `release/**` branches.                                                                                                                       |
| `beta-release`     | PR closed against `release/**`                      | PR was merged            | Build, derive the beta version, publish to npm under `beta`, upload an artifact with the exact version.                                                                                                          |
| `acceptance-tests` | `beta-release` completed                            | `beta-release` succeeded | Require the `HN_CRAWLER_ACCEPTANCE_URL` repository variable, configure a temporary usage database, download the beta version artifact, install that exact published beta, and run acceptance tests from `QA.md`. |
| `release`          | PR merged into `main`                               | PR was merged            | Build, publish the `package.json` version to npm as public under `latest`.                                                                                                                                       |

## Tools

GitHub Actions for workflows, the npm registry for publishing (with an `NPM_TOKEN` repository secret), Husky for hooks.
