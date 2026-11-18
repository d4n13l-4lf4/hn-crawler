# Research: Crawl Top Stories Refinements

**Feature**: 002-crawl-top-stories  
**Date**: 2026-11-18

## 1. Acceptance URL from repository configuration

**Decision**: The acceptance process reads `HN_CRAWLER_ACCEPTANCE_URL`, supplied locally by the developer and in GitHub Actions from the manually created repository variable of the same name. The workflow explicitly maps `${{ vars.HN_CRAWLER_ACCEPTANCE_URL }}` into the acceptance step. It separately sets `HN_CRAWLER_BETA=true` to expose `--url`. If the URL is absent, both CI preflight and the step setup fail clearly rather than defaulting to the public HN page.

**Rationale**: The user wants one manually maintained repository-level value shared with CI and a prepared local command. Repository variables are exposed to workflows through the `vars` context, but they are not automatically exported as process environment variables. Explicit mapping makes the workflow contract visible and deterministic.

**CI flow check**: `.github/workflows/acceptance-tests.yml` is triggered on completion of the beta release workflow and runs under the same repository configuration, so a repository-level variable is available to that workflow. It maps the repository variable into the test step, sets the beta flag, and validates the URL before invoking Cucumber. The beta publishing workflow itself does not need the URL; the downstream acceptance workflow does.

**Local command**: `HN_CRAWLER_ACCEPTANCE_URL='<user-provided fixture URL>' HN_CRAWLER_BETA=true npm run test:acceptance:local`. The repository variable is configured manually by the user; a shell environment assignment is needed when running locally. This command is documentation only in this feature and must not be executed locally.

**Acceptance scenarios**: The configured page supplies the 30-entry/output and beta URL scenarios. Failure behavior uses an invalid URL to avoid adding a second URL configuration. Empty and fewer-than-30 pages remain covered by parser unit tests because the suite accepts one repository-level page URL.

**Alternatives considered**:

- Use a GitHub secret: unnecessary because the fixture URL is not secret.
- Default an absent value to `https://news.ycombinator.com/`: rejected because acceptance would become live and nondeterministic.
- Have the steps start a local loopback server: rejected by the requested environment-variable approach.

## 2. Configured default URL injection

**Decision**: Add `src/config/config.ts` with an exported configuration object containing `newsCombinatorUrl: 'https://news.ycombinator.com/'`. The composition root reads that value and provides it to the crawler flow. The use case receives the requested URL as an argument and contains no default URL constant.

**Rationale**: The application use case should perform orchestration and receive inputs from an upper layer. The composition root is the established configuration and dependency wiring boundary. A beta `--url` value can override the configured default at the presentation boundary.

**Alternatives considered**:

- Keep the URL fallback in the use case: rejected because application policy would own deployment configuration.
- Read process environment directly in the use case: rejected because it couples application code to runtime configuration and weakens testability.

## 3. HTTP error chaining

**Decision**: Catch errors from the `fetch(url)` operation and throw a contextual `Error` with `{ cause: error }`. Keep non-success HTTP response handling as an HTTP-status error. Do not add retry or timeout behavior.

**Rationale**: The caller receives helpful operation context while the original network exception remains available through `cause`, as requested. HTTP responses with non-success status are not network exceptions and keep their status context.

**Alternatives considered**:

- Re-throw the same network error: rejected by the requested explicit cause-chaining change.
- Replace all failures with a generic HTTP error: rejected because it obscures the underlying cause and status.

## 4. Import alias

**Decision**: Use the already configured `@/*` TypeScript path alias for imports between source modules where supported by the existing build/test/runtime setup. Keep the alias mapping in `tsconfig.json` unchanged unless implementation validation demonstrates a necessary tooling adjustment.

**Rationale**: The alias is already defined as `@/*` → `src/*`; using it shortens imports and avoids creating new conventions.

**Alternatives considered**:

- Add a second alias or dependency: unnecessary and outside scope.

## 5. Domain value objects and parser responsibility

**Decision**: Add `Title` and `Numeric` value objects under `src/domain/vo`. `Title` accepts raw string input and normalizes unusable/missing input to `''`. `Numeric` accepts raw numeric/text input, extracts the first digit sequence with a precompiled `/\d+/` matcher where applicable, converts safely to a number, and defaults invalid/unmatched/NaN values to `0`. `HNEntry` stores these values for its title, rank, points, and comment count. The presentation serializer emits the primitive values in the unchanged JSON contract.

The parser remains responsible for selecting HN nodes and capturing text with best effort. It keeps separate regular-expression matchers for score and comments, passes extracted text/value to the corresponding VOs, and removes `normalizeText` and `parseInteger` helpers. Missing source text flows through the VOs to the established defaults.

**Rationale**: Text and numeric normalization are domain decisions and belong in the dependency-free domain layer. This makes defaults consistent wherever an HNEntry is created, while allowing the infrastructure parser to focus on extracting source data.

**Alternatives considered**:

- Keep normalization in the parser: rejected because defaults and parsing rules would be infrastructure-local.
- Add a general parsing library: rejected because the requested rules need only built-in regular expressions and number conversion.
- Serialize class instances directly: rejected because the external JSON contract must remain four primitive fields.

## 6. Review and acceptance execution policy

**Decision**: Maintain one implementation milestone per user refinement, with a user review pause after each. Acceptance-related code/config changes can be prepared as directed, but acceptance tests are not run locally for this feature. Tasks for acceptance harness review and eventual execution remain distinct and unchecked until user direction.

**Rationale**: This preserves the requested incremental review process and the user's explicit instruction to defer acceptance testing.

**Alternatives considered**:

- Run acceptance tests as a final local gate: rejected because the user explicitly prohibited local acceptance execution for this feature.
