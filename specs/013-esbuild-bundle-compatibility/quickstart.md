# Quickstart Validation Guide: Refactor for Esbuild Bundle Compatibility

**Feature**: 013-esbuild-bundle-compatibility  
**Date**: 2026-11-20

## Purpose

Document runnable validation scenarios that prove the esbuild bundle compatibility refactor preserves existing CLI behavior: `hn-crawler --version` shows the correct version, and migration files are located correctly when running from the bundled binary. This guide is a validation/run reference; implementation details belong in `tasks.md` and the implementation phase.

## Prerequisites

- Build completed: `npm run build` (generates `dist/main.js` via esbuild)
- Quality gates pass: `npm run quality`

## Validation scenarios

Run each scenario locally or in CI and compare to expected outcomes.

### 1. CLI version displayed from bundled variable

```
node dist/main.js --version
```

Expected outcome:

- Output contains the app version (e.g., `1.0.3`).
- Exit code is 0.
- No error about missing `package.json` or `__dirname`.

### 2. Migration files located from bundled binary

```
HN_CRAWLER_WEB_PAGE_BASE_URL=<deterministic-page-url> \
  HN_CRAWLER_DB_PATH=<temp-db> \
  node dist/main.js crawl
```

Expected outcome:

- Migration files are found and applied without error (`SQLite migration files not found` must not appear).
- Crawl command runs successfully.
- Exit code is 0.

### 3. All CLI subcommands function in the bundle

```
node dist/main.js --help
node dist/main.js crawl --help
node dist/main.js usage --help
```

Expected outcome:

- All subcommands display help without errors.
- Exit code is 0.

### 4. No functional behavior change

Run the unit test suite:

```
npm run test:unit
```

Expected outcome:

- All existing unit tests pass.
- Coverage remains at 100%.
- Exit code is 0.

Acceptance tests (Cucumber) are not modified and are run manually by the user at the end of the implementation; the agent does not execute them.

## Verifying the refactor

- Run `npm run quality` (format, lint, typecheck, test+coverage) — must be fully green.
- Run `npm run build` — must succeed.
- `hn-crawler --version` and all subcommands work from `dist/main.js`.
- No new CLI options, commands, or output formats are introduced.
- Application runtime behavior is unchanged.

## References

- Feature specification: `specs/013-esbuild-bundle-compatibility/spec.md`
- Implementation plan: `specs/013-esbuild-bundle-compatibility/plan.md`
- Data model: `specs/013-esbuild-bundle-compatibility/data-model.md`
- Research decisions: `specs/013-esbuild-bundle-compatibility/research.md`
- Contracts: none (the CLI command contract is unchanged by this refactor)
