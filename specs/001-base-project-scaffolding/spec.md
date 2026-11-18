# Feature Specification: Base Project Scaffolding

**Feature Branch**: `001-base-project-scaffolding`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Let's work on the first user story. We need to implement the base project scaffolding. In this sense, we are going to be deploying our first beta version. This minimal version will dump just a hello world command that outputs hellow world at the output cli. So, there is no need to implement the actual behavior, but we need to create the entire project scaffolding, complete unit tests of this functionality keeping it minimal, but including both unit tests and acceptance test for this. Also, we need to create the specific CICD workflows following the CICD guidelines, the quality gates, and hooks, and the project libraries."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Hello World CLI Command (Priority: P1)

As a developer, I want to run the CLI and see a "Hello World" output, so that I can verify the project builds, runs, and the basic command structure works.

**Why this priority**: This is the minimal viable slice that validates the entire toolchain (TypeScript compilation, Commander CLI framework, entry point, packaging) works end-to-end before adding real functionality.

**Independent Test**: Can be fully tested by running the compiled CLI binary with no arguments and verifying "Hello World" prints to stdout with exit code 0.

**Acceptance Scenarios**:

1. **Given** the project is built, **When** the user runs `hn-crawler` with no arguments, **Then** the output is "Hello World" and exit code is 0.
2. **Given** the project is built, **When** the user runs `hn-crawler --help`, **Then** usage information is displayed and exit code is 0.

---

### User Story 2 - Quality Gates Enforcement (Priority: P1)

As a developer, I want quality gates (format, lint, typecheck, test+coverage) to run automatically on commit and in CI, so that only code meeting standards enters the repository.

**Why this priority**: The constitution mandates quality gates on every commit (pre-commit hook) and PR (CI workflow). Without this, the project cannot maintain its quality standards.

**Independent Test**: Can be tested by intentionally introducing a formatting error, lint error, type error, or failing test, then attempting to commit or push — the gate should block the operation.

**Acceptance Scenarios**:

1. **Given** a staged file with a formatting violation, **When** the user runs `git commit`, **Then** the pre-commit hook runs Prettier check and rejects the commit.
2. **Given** a PR with a lint error, **When** the CI workflow runs, **Then** the `ci` job fails and blocks merge.
3. **Given** a PR with type errors, **When** the CI workflow runs, **Then** the `typecheck` gate fails.
4. **Given** a PR with test coverage below 100%, **When** the CI workflow runs, **Then** the `test:coverage` gate fails.

---

### User Story 3 - CI/CD Workflow for Beta Releases (Priority: P1)

As a maintainer, I want the CI/CD pipeline to build, version, and publish beta packages on `release/**` branches, so that acceptance tests can run against real published artifacts.

**Why this priority**: The CICD.md document defines a four-workflow pipeline (`ci`, `beta-release`, `acceptance-tests`, `release`). The beta-release workflow is the gateway to publishing the first beta version.

**Independent Test**: Can be tested by merging a PR into a `release/**` branch, verifying the `beta-release` workflow publishes the exact beta version and artifact, and verifying the following acceptance workflow installs that exact version.

**Acceptance Scenarios**:

1. **Given** a PR is merged into `release/v1.0.0`, **When** the `beta-release` workflow runs, **Then** it publishes a package like `1.0.0-beta.sha<short-SHA>` to the npm `beta` tag and uploads an artifact containing that exact version.
2. **Given** the `beta-release` workflow succeeds, **When** the `acceptance-tests` workflow runs, **Then** it downloads the published beta, installs it, and runs acceptance tests against the installed CLI.
3. **Given** a release PR is merged into `main`, **When** the `release` workflow runs, **Then** it publishes the production version to npm `latest`.

---

### User Story 4 - Project Structure and Libraries (Priority: P2)

As a developer, I want the project initialized with the correct folder structure, package.json, tsconfig, and all required dependencies, so that the hexagonal architecture layers are in place from day one.

**Why this priority**: The architecture document defines a specific folder layout and technology stack. Setting this up correctly enables all future development to follow the established patterns.

**Independent Test**: Can be verified by inspecting the repository structure against the scaffolding defined in ARCHITECTURE.md and confirming all required config files exist with correct settings.

**Acceptance Scenarios**:

1. **Given** a fresh clone, **When** the user runs `npm install`, **Then** all dependencies install without errors.
2. **Given** the project structure, **When** the user inspects `src/`, **Then** the folders `domain`, `application`, `infrastructure`, `presentation` exist with correct subfolders.
3. **Given** the `package.json`, **When** the user runs `npm run quality`, **Then** all four quality gates execute (format:check, lint, typecheck, test:coverage).

---

### Edge Cases

- What happens when the CLI is run with an unknown subcommand? → Commander should show an error and usage help.
- What happens when Node version doesn't match `.nvmrc`? → CI workflows should use the version from `.nvmrc`; local development documented to use nvm.
- What happens if `node:sqlite` API changes in a future Node version? → The constitution notes this as the one API to re-check when upgrading Node (ARCHITECTURE.md).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a CLI entry point named `hn-crawler` that outputs "Hello World" when run without arguments.
- **FR-002**: System MUST use Commander for CLI argument parsing and command registration.
- **FR-003**: System MUST compile TypeScript to JavaScript in a `dist/` folder (ignored by git) using `tsc` with no bundler.
- **FR-004**: System MUST include a `package.json` with scripts for all quality gates (`format:check`, `lint`, `typecheck`, `test:coverage`, `quality`, `test:acceptance`).
- **FR-005**: System MUST enforce code formatting via Prettier (check mode) on every commit and in CI.
- **FR-006**: System MUST enforce linting via ESLint on every commit and in CI.
- **FR-007**: System MUST enforce TypeScript type checking (no emit) on every commit and in CI.
- **FR-008**: System MUST run unit tests with Vitest and require 100% coverage (excluding composition root) on every commit and in CI.
- **FR-009**: System MUST include a Husky pre-commit hook that runs all four quality gates.
- **FR-010**: System MUST include GitHub Actions workflows for `ci`, `beta-release`, `acceptance-tests`, and `release` as defined in CICD.md.
- **FR-011**: System MUST implement semantic versioning with beta format `<version>-beta.sha<short-SHA>` published under npm `beta` tag.
- **FR-012**: System MUST include the hexagonal architecture folder structure: `src/domain`, `src/application` (with `ports`, `pipeline`, `pipeline/steps`, `pipeline/composed`), `src/infrastructure` (with `web`, `persistence`), `src/presentation`.
- **FR-013**: System MUST include test folder structure: `tests/unit` (mirroring `src`), `tests/acceptance` (with `features`, `steps`), `tests/fixtures`.
- **FR-014**: System MUST include a unit test for the CLI command that verifies "Hello World" output.
- **FR-015**: System MUST include an acceptance test (Cucumber/Gherkin) that runs the compiled CLI and verifies "Hello World" output.
- **FR-016**: System MUST use Node 26 LTS (pinned in `.nvmrc`).
- **FR-017**: System MUST include TypeScript strict mode configuration.
- **FR-018**: System MUST include `.gitignore` excluding `dist/`, `node_modules/`, `*.log`, `.sqlite` database files.
- **FR-019**: System MUST include a `README.md` with basic project description and usage instructions.

### Key Entities

- **CLI Command**: The primary user-facing command (`hn-crawler`) with subcommands; initially only a default "hello world" action.
- **Quality Gate**: An automated check (format, lint, typecheck, test+coverage) that must pass for code to be committed or merged.
- **Beta Release**: A versioned npm package published under the `beta` tag with format `<version>-beta.sha<short-SHA>`.
- **Project Structure**: The folder layout defining the hexagonal architecture layers and test organization.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Running `hn-crawler` outputs exactly "Hello World" with exit code 0 within 500ms on a modern development machine.
- **SC-002**: All four quality gates (format, lint, typecheck, test+coverage) pass on a clean implementation with 100% unit-test coverage.
- **SC-003**: The `ci` GitHub Actions workflow completes in under 5 minutes for a typical PR.
- **SC-004**: The `beta-release` workflow publishes a valid semver beta package and uploads an artifact containing its exact version, which can be installed using `npm install hn-crawler@<artifact-version>`.
- **SC-005**: The `acceptance-tests` workflow successfully installs the beta package and runs the acceptance test suite against it.
- **SC-006**: A developer can clone the repo, run `npm install`, run `npm run quality`, and have all gates pass without configuration.
- **SC-007**: The project folder structure matches the architecture document exactly (verified by automated check or manual inspection).
- **SC-008**: The Husky pre-commit hook executes all four quality gates and blocks commit on any failure.

## Assumptions

- Target users are developers familiar with Node.js, TypeScript, and CLI tools.
- The project will be published to the public npm registry (requires `NPM_TOKEN` secret in GitHub).
- Node 26 LTS is available and stable; `.nvmrc` pins the exact version.
- The `node:sqlite` module (release candidate in Node 26) will be used for persistence in future stories; not needed for hello world.
- GitHub Actions is the CI/CD platform; GitHub repository secrets will hold `NPM_TOKEN`.
- Acceptance tests run against the published beta package, not local source (per CICD.md).
- The "Hello World" command is a temporary placeholder; the real `scrape` subcommand will be implemented in a subsequent story.
- No authentication, authorization, or multi-user concerns at this stage.
- Mobile support is out of scope (this is a CLI tool).
- Internationalization is out of scope (English only).
