# Quickstart Validation Guide: Base Project Scaffolding

**Feature**: 001-base-project-scaffolding  
**Date**: 2026-11-17

---

## Prerequisites

- Node.js 26 LTS (install via `nvm install 26` or use `.nvmrc`)
- npm 10+ (bundled with Node 26)
- Git
- GitHub CLI (`gh`) for inspecting workflow runs (optional)

---

## 1. Fresh Clone & Install

```bash
# Clone the repository
git clone <repo-url>
cd hn-crawler

# Verify Node version matches .nvmrc
nvm use  # or: node --version  # should be v26.x.x

# Install dependencies (including devDependencies)
npm ci
```

**Expected**: All packages install without errors. `node_modules/` created.

---

## 2. Build the Project

```bash
# Compile TypeScript to dist/
npm run build
```

**Expected**:

- `dist/` folder created with compiled JavaScript
- `dist/presentation/main.js` exists (CLI entry point)
- No TypeScript errors

---

## 3. Run the CLI (Hello World)

```bash
# Run the compiled CLI directly
node dist/presentation/main.js

# Or via package.json bin (after npm link or install)
npm link
hn-crawler
```

**Expected Output**:

```
Hello World
```

**Exit Code**: `0` (verify with `echo $?`)

---

## 4. Test Help & Version

```bash
# Help
hn-crawler --help

# Version
hn-crawler --version
```

**Expected**:

- `--help` shows the CLI usage and available options (no subcommands are implemented in this scaffolding story)
- `--version` prints `1.0.0` (from package.json)

---

## 5. Run Quality Gates

```bash
# Run all four gates sequentially (format, lint, typecheck, test+coverage)
npm run quality
```

**Expected**: All four gates pass with exit code 0.

### Individual Gates

```bash
# Format check only
npm run format:check

# Lint only
npm run lint

# Type check only
npm run typecheck

# Tests with coverage (100% required)
npm run test:coverage
```

**Expected**: Each gate passes individually.

---

## 6. Verify Test Coverage

```bash
# Check coverage report
npm run test:coverage
# Open coverage/index.html in browser for detailed report
```

**Expected**:

- Coverage summary shows 100% for lines, functions, branches, statements
- `src/presentation/main.ts` excluded from coverage (composition root)

---

## 7. Run Acceptance Tests (Local)

```bash
# Use the local variant: it builds and installs the working tree package,
# runs the acceptance tests, then removes the global installation.
npm run test:acceptance:local
```

**Expected**:

- The local package is built and installed before Cucumber runs feature scenarios
- "Hello World" scenario passes
- Exit code 0

In CI, use `npm run test:acceptance` only after installing the exact beta version
provided by the beta-release workflow artifact. Do not use the mutable `@beta`
tag or the CI command for local validation.

---

## 8. Verify Project Structure

```bash
# Check required folders exist
ls -la src/
# Should see: domain, application, infrastructure, presentation

ls -la src/application/
# Should see: ports, pipeline

ls -la tests/
# Should see: unit, acceptance, fixtures

ls -la tests/acceptance/
# Should see: features, steps
```

**Expected**: All folders from ARCHITECTURE.md scaffolding exist.

---

## 9. Test Pre-commit Hook

```bash
# Stage a file
git add package.json

# Attempt commit (should run quality gates)
git commit -m "test: verify pre-commit hook"
```

**Expected**:

- Husky runs `npm run quality`
- Commit succeeds if all gates pass
- If gates fail, commit is blocked with error output

---

## 10. Verify GitHub Actions Workflows (Local Simulation)

```bash
# Install act (GitHub Actions local runner) - optional
# brew install act  # macOS
# Or run workflows on GitHub by pushing to a feature branch
```

**Expected** (on GitHub):

- Push to `feature/**` branch → `ci` workflow runs
- Merge PR to `release/**` → `beta-release` → `acceptance-tests` (CI runs on the PR before merge)
- Merge release PR to `main` → existing `release` workflow publishes to npm

---

## Validation Checklist

| Step | Command                            | Success Criteria                                            |
| ---- | ---------------------------------- | ----------------------------------------------------------- |
| 1    | `npm ci`                           | No install errors                                           |
| 2    | `npm run build`                    | `dist/` created, no TS errors                               |
| 3    | `node dist/presentation/main.js`   | Outputs "Hello World", exit 0                               |
| 4    | `hn-crawler --help`                | Shows usage, exit 0                                         |
| 5    | `hn-crawler --version`             | Prints version, exit 0                                      |
| 6    | `npm run quality`                  | All 4 gates pass                                            |
| 7    | `npm run test:coverage`            | 100% coverage (excl. main.ts)                               |
| 8    | `npm run test:acceptance:local`    | Builds and installs the local package, then Cucumber passes |
| 9    | `ls src/ tests/`                   | All required folders exist                                  |
| 10   | `git commit` (with staged changes) | Husky runs quality, blocks on failure                       |

---

## Troubleshooting

| Issue                           | Resolution                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `command not found: hn-crawler` | Run `npm link` or use `node dist/presentation/main.js`                                                                      |
| TypeScript errors on build      | Check `tsconfig.json` paths; ensure all imports use `@domain/*` etc.                                                        |
| Coverage < 100%                 | Add tests for uncovered lines in `tests/unit/` mirroring `src/`                                                             |
| Husky not running               | Run `npm run prepare` to install hooks; check `.husky/pre-commit` exists                                                    |
| Cucumber: "cannot find module"  | Run `npm run test:acceptance:local` for local validation; in CI, verify the exact published beta package is installed first |

---

## Related Documents

- [Specification](spec.md) — User stories and requirements
- [Plan](plan.md) — Implementation approach
- [Data Model](data-model.md) — Entity definitions
- [CLI Contract](contracts/cli-command.md) — Command interface
- [Research](research.md) — Technical decisions
- [Architecture](../docs/ARCHITECTURE.md) — Folder structure, patterns
- [Quality](../docs/QUALITY.md) — Test levels, gates
- [CI/CD](../docs/CICD.md) — Workflows, versioning
