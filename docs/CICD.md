# CI/CD

> References: `QA.md` (quality gates and acceptance tests) · `ARCHITECTURE.md` (build and technologies)

## Branching (gitflow)

| Branch | Purpose |
| --- | --- |
| `main` | Production. |
| `release/**` | An epic. Accumulates features and publishes betas. |
| `feature/**` | Incremental user-story changes, merged into a `release/**` branch by PR. |

Flow: `feature/**` → PR → `release/**` → PR → `main`.

## Versioning

- Semver. The version lives in `package.json` and is bumped on the `release/**` branch.
- **Beta:** `<package.json version>-beta.sha<short commit SHA>`, for example `1.2.0-beta.sha1a2b3c4`. It is unique per commit and valid semver, and it is published under the `beta` npm tag.
- **Production:** the `package.json` version, published as public under `latest`.

## Local development

- Feature branches are tested locally using the scripts described in `QA.md`.
- A Husky pre-commit hook runs the quality gates from `QA.md`, so failing code cannot be committed.

## Workflows

All workflows use the Node version from `.nvmrc`.

| Workflow | Trigger | Condition | Jobs |
| --- | --- | --- | --- |
| `ci` | PR opened or updated against `release/**` or `main` | none | Run the quality gates from `QA.md`. This validates `feature/**` and `release/**` branches. |
| `beta-release` | PR opened or updated against `release/**` | `ci` passed for the `feature/**` branch | Build, derive the beta version, publish to npm under `beta`, upload an artifact with the version. |
| `acceptance-tests` | `beta-release` completed | `beta-release` succeeded | Download the artifact, install that published beta, run the acceptance tests from `QA.md` against it. |
| `release` | PR merged into `main` | `ci`, `beta-release` and `acceptance-tests` succeeded for the merged `release/**` branch | Build, publish the `package.json` version to npm as public. |

## Tools

GitHub Actions for workflows, the npm registry for publishing (with an `NPM_TOKEN` repository secret), Husky for hooks.