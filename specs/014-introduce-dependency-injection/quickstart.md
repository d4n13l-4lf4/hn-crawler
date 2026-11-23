# Quickstart: Validate the Dependency Injection Refactor

This guide documents runnable validation scenarios that prove the DI refactor works end-to-end without changing functional behavior.

## Prerequisites

- Node 26 LTS installed
- Repository dependencies installed (`npm install`)
- Existing build tooling available (`esbuild`, `tsc`, `vitest`)

## Validation Scenarios

### Scenario 1: Build succeeds with the new composition root

**Goal**: Verify the project compiles and bundles after moving the composition root to `src/main.ts` and introducing `src/bootstrap/`.

1. Run `npm run build`.
2. Observe that `dist/main.js` is produced without TypeScript or bundling errors.
3. Confirm `src/presentation/main.ts` no longer exists and `src/main.ts` exists.

**Expected outcome**: Build completes successfully; `dist/main.js` is generated.

### Scenario 2: CLI crawl command behaves identically

**Goal**: Verify the `crawl` subcommand produces identical output, exit codes, and error handling after the refactor.

1. Run the CLI: `node dist/main.js crawl`.
2. Capture the output fields (rank, title, points, comments), ordering, and exit code.
3. Compare against the pre-refactor behavior (same command, same output).

**Expected outcome**: Output fields, ordering, error messages, and exit code are unchanged.

### Scenario 3: CLI usage command behaves identically

**Goal**: Verify the `usage` subcommand produces identical output after the refactor.

1. Run the CLI: `node dist/main.js usage`.
2. Capture the usage records output and exit code.
3. Compare against the pre-refactor behavior.

**Expected outcome**: Output and exit code are unchanged.

### Scenario 4: No runtime errors from DI container

**Goal**: Verify the container assembles without binding or resolution errors.

1. Run any CLI subcommand (e.g., `node dist/main.js crawl`, `node dist/main.js usage`, `node dist/main.js --help`).
2. Observe that no "binding not found", "circular dependency", or "ambiguous match" errors occur.

**Expected outcome**: Commands execute with no DI-related runtime errors.

### Scenario 5: Existing acceptance tests pass with zero modifications

**Goal**: Verify the acceptance suite continues to pass unchanged.

1. Run `npm run test:acceptance:local` (builds, installs locally, runs Cucumber against the acceptance URL).
2. Confirm all acceptance scenarios pass.

**Expected outcome**: All acceptance tests pass with zero modifications to feature files or step definitions.

## References

- Feature specification: `specs/014-introduce-dependency-injection/spec.md`
- Implementation plan: `specs/014-introduce-dependency-injection/plan.md`
- Binding data model: `specs/014-introduce-dependency-injection/data-model.md`
- CLI contract: unchanged (see `contracts/` note below)

## Contracts

This refactor introduces no changes to the CLI contract. The commands (`crawl`, `usage`), their options, output format, exit codes, and error handling remain identical. See `specs/014-introduce-dependency-injection/contracts/` for the (unchanged) CLI command contract note.
