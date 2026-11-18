# Implementation Plan: Crawl Top Stories Refinements

**Branch**: `feature/SC-001` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Existing feature specification plus refinement requests in this planning session.

## Summary

Refine the existing `crawl` implementation in six review milestones: wire deterministic acceptance input from a repository-level environment variable and confirm its CI availability; move the default Hacker News URL into `src/config/config.ts` and inject it from the composition root; preserve HTTP network failures with `Error.cause`; standardize internal imports on the existing `@/*` alias; move title and numeric normalization into dependency-free domain value objects; and reconcile tasks that were deferred with acceptance execution. The CLI output remains up to 30 ordered entries with the existing JSON fields. Acceptance tests are not to be run locally for this feature.

## Technical Context

**Language/Version**: TypeScript 5.7 strict mode, Node.js 26 (`.nvmrc`)

**Primary Dependencies**: Commander 12.1, native `fetch`, Cheerio 1.0.0; no new dependencies planned

**Storage**: N/A

**Testing**: Vitest unit tests with 100% coverage target. Acceptance test code may be adjusted, but acceptance tests must not be run locally in this feature. The existing CI acceptance workflow runs against a published beta and must receive the fixture URL repository variable explicitly.

**Target Platform**: Node.js 26 CLI on platforms supported by the existing package; GitHub Actions for beta acceptance runs

**Project Type**: Standalone CLI

**Performance Goals**: Preserve the current bounded 30-entry behavior; no new performance target.

**Constraints**: Follow hexagonal architecture and dependency-free domain rules. `config/config.ts` is read at the composition root and injected into the use case. HTTP network errors retain their cause. Parser extracts source text with best effort; domain VOs own normalization/defaults. `--url` remains beta-gated by `HN_CRAWLER_BETA=true`. Acceptance tests are not executed locally.

**Scale/Scope**: Refinements to the existing single-page crawl feature; no filtering, pagination, or usage statistics.

## Constitution Check

| Gate                                            | Status                                           | Plan                                                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hexagonal dependency rule                       | PASS                                             | Configuration is provided by the composition root; application receives a URL parameter and depends on ports/domain only. Domain value objects import no external or upper-layer modules. |
| Test-first development                          | PASS with acceptance exception requested by user | Add/update unit tests before implementation. Prepare acceptance coverage and CI wiring, but do not run acceptance locally. Acceptance execution remains pending a later user decision.    |
| Pure data processing and side-effect boundaries | PASS                                             | Parser remains an async generator over supplied HTML; HTTP remains in infrastructure.                                                                                                     |
| Simplicity and naming                           | PASS                                             | Add only `src/config/config.ts` and the two requested `src/domain/vo` files; use existing path alias.                                                                                     |
| Deterministic domain behavior                   | PASS                                             | String default remains empty; numeric default remains zero; output values and first-30 ordering stay unchanged.                                                                           |

## Project Structure

### Documentation (this feature)

```text
specs/002-crawl-top-stories/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── config/config.ts
├── domain/
│   ├── entities/hn-entry.entity.ts
│   └── vo/
│       ├── numeric.ts
│       └── title.ts
├── application/
│   ├── ports/in/crawler.port.ts
│   ├── ports/out/entry-source.port.ts
│   └── usecases/crawler.usecase.ts
├── infrastructure/web/
│   ├── hn-crawler.parser.ts
│   ├── hn-http.client.ts
│   └── hn-web.adapter.ts
└── presentation/
    ├── cli/cli.ts
    ├── cli/crawl.ts
    └── main.ts

tests/
├── resources/hacker-news.html
├── acceptance/features/crawl.feature
├── acceptance/steps/crawl.steps.ts
└── unit/ (mirrors changed source modules)
```

**Structure Decision**: Keep the existing feature architecture. Add configuration as requested and value objects under the project's `domain/vo` convention. Preserve the composition root as the sole concrete wiring location.

## Incremental Implementation Milestones

Each numbered milestone below is a user review boundary. Complete the milestone, report changed artifacts and relevant checks, then stop for user confirmation before starting the next milestone. Each user-requested refinement is represented as its own milestone. Do not run acceptance tests locally during this feature, including as a milestone check.

### Milestone 1 — Acceptance URL environment and CI flow

- Use a repository-level GitHub Actions variable named `HN_CRAWLER_ACCEPTANCE_URL` for the deterministic acceptance page URL. The user will define its value manually in repository settings.
- Acceptance steps read that variable rather than starting a local fixture server or embedding a URL. Beta option exposure is controlled separately by `HN_CRAWLER_BETA=true`.
- `.github/workflows/acceptance-tests.yml` maps `${{ vars.HN_CRAWLER_ACCEPTANCE_URL }}` and sets `HN_CRAWLER_BETA=true` for the acceptance process. The beta-release workflow publishes the package; the following acceptance workflow runs in the same repository context where repository variables are available.
- A CI preflight fails clearly when the variable is missing, so acceptance does not silently fall back to the live site.
- The local command using `HN_CRAWLER_ACCEPTANCE_URL` and `HN_CRAWLER_BETA=true` is documented in `quickstart.md`; do not execute it locally.
- Acceptance scenarios cover the configured page's output, beta URL selection, crawler failure, and production option behavior. Empty and fewer-than-30 page cases remain unit-tested because one environment variable supplies the acceptance page for the suite.
- Do not run the acceptance suite locally at this milestone or later in this feature. Acceptance execution remains deferred pending the user's review.

### Milestone 2 — Configured default URL injection

- Add `src/config/config.ts` to expose the application configuration, including `newsCombinatorUrl: 'https://news.ycombinator.com/'`.
- Change the crawler use case so its URL is supplied by its caller; remove the hardcoded fallback from the use case.
- Pass `config.newsCombinatorUrl` from `src/presentation/main.ts` through the relevant command/use-case invocation while allowing beta `--url` to override it.
- Update unit tests to assert the configured default and URL override, then run affected unit tests and quality gates.

### Milestone 3 — HTTP network error cause chaining

- Catch errors from the native `fetch` call in `src/infrastructure/web/hn-http.client.ts` and rethrow with context using `new Error(message, { cause: error })`.
- Preserve existing HTTP status errors and response-body behavior; do not replace the underlying cause or add retries/timeouts.
- Update table-driven HTTP client tests to assert the new error and its `cause`, as well as outcome and mock arguments. Run focused tests and quality gates.

### Milestone 4 — Import alias consistency

- Replace eligible relative imports across source and unit tests touched by this feature with the existing `@/*` alias configured in `tsconfig.json`.
- Preserve relative imports where required by the project/runtime tooling or where aliasing would not resolve correctly; verify build, lint, typecheck, formatter, and unit coverage.

### Milestone 5 — HNEntry title and numeric value objects

- Add dependency-free `src/domain/vo/title.ts`, accepting raw string input and defaulting missing/invalid input to `''`.
- Add dependency-free `src/domain/vo/numeric.ts`, accepting raw numeric/text input, extracting the first digit sequence with a precompiled `/\d+/` expression where applicable, and defaulting unmatched, invalid, or `NaN` results to `0`.
- Update `HNEntry` to hold these value objects for `title`, `rank`, `points`, and `number_of_comments`. Preserve the public JSON contract by serializing primitive values at the presentation boundary.
- Update parser behavior: retain distinct score and comment matchers, capture relevant text best-effort, and pass values into the VOs. Remove parser-level `normalizeText` and `parseInteger` helpers.
- Add table-driven VO/entity/parser/serialization tests before implementation; retain the fixture expectation for the first parsed entry (rank 1, title `Java4Shell: RCE in OpenJDK when processing Base64`, points 795, comments 211). Run focused tests and all non-acceptance quality gates.

### Milestone 6 — Acceptance-related task reconciliation and final non-acceptance checks

- Update `tasks.md` to reflect the five preceding implementation milestones and the user's deferred acceptance review. Correct obsolete tasks that assume a loopback server or local acceptance execution; preserve completed work and keep unfinished acceptance tasks unchecked.
- Keep acceptance step review/finalization and acceptance execution as separate unchecked tasks. Do not run acceptance tests locally.
- Run build and non-acceptance quality gates only after their implementation milestones have been approved and completed. Acceptance execution is explicitly left pending the user's comments and later direction.

## CI/CD Acceptance URL Feasibility

The existing `.github/workflows/acceptance-tests.yml` is triggered by completion of `Beta Release` and runs in this repository. GitHub Actions repository variables are available to that workflow through the `vars` context, but are not automatically injected into the job environment. The workflow explicitly maps `HN_CRAWLER_ACCEPTANCE_URL: ${{ vars.HN_CRAWLER_ACCEPTANCE_URL }}` and `HN_CRAWLER_BETA: 'true'` into the acceptance process and fails with a clear setup message if the URL variable is absent. The user must create the repository variable manually. No change is needed in the beta publishing workflow to expose a repository Actions variable to the subsequent workflow.

## Complexity Tracking

No constitution violations or additional dependencies are planned.
