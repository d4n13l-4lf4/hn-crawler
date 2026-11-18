# Implementation Plan: Filter and Sort Hacker News Stories

**Branch**: `003-filter-sort-stories` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-filter-sort-stories/spec.md`

## Summary

Add configurable filtering and ranking to the existing crawl command. The use case will retrieve up to the first 30 entries from the entry source, create a processing pipeline through an application-owned factory interface, and apply an async filter plus a stable bounded top-K ranking operator. Domain title-word policies will supply predicates for `gt` and `le`; the CLI will parse options, supply defaults (`gt:5`, comments descending), and preserve the established output and error contracts. The acceptance suite will remain a standalone CLI black-box suite and assert non-zero status for failures.

The candidate set is explicitly bounded before filtering and ranking: the first 30 retrieved entries, or fewer if the page provides fewer. Ranking therefore selects up to 30 eligible entries from this set.

## Technical Context

**Language/Version**: TypeScript 5.7, strict mode; Node.js 26 LTS

**Primary Dependencies**: Commander 12, native async iterables, Vitest, Cucumber; no new runtime dependencies

**Storage**: N/A for this feature; usage statistics remain out of scope

**Testing**: Vitest unit tests with table-driven `should` phrasing and 100% coverage; Cucumber acceptance tests against the standalone CLI and configured deterministic URL

**Target Platform**: Node.js CLI on supported CI and developer platforms

**Project Type**: Single TypeScript CLI project

**Performance Goals**: Lazy filtering; ranking retains at most the configured window (30) while consuming its source. Overall candidate input is already limited to 30 entries.

**Constraints**: Preserve hexagonal dependency direction; domain policies remain pure; pipeline factory is injected through an application port/type; network-free unit tests; no acceptance execution until the final milestone and explicit user review; no usage statistics, pagination, or extra crawl processing.

**Scale/Scope**: One Hacker News page, at most 30 retrieved candidates and at most 30 output entries; four filter/ranking pairings plus defaults and invalid argument cases.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                      | Status                            | Plan response                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hexagonal architecture and dependency rule     | PASS                              | Domain policies define predicates; application owns pipeline orchestration and factory contract; concrete pipeline factory is injected by the composition root. CLI depends only on the crawler inbound port.                                                                                                                                                       |
| Test-first development                         | PASS WITH SEQUENCING NOTE         | Acceptance scenarios are prepared first but not run. To honor green incremental milestones, each accepted milestone must leave formatting, lint, typecheck, and unit tests green; acceptance execution is reserved for the final milestone.                                                                                                                         |
| Pure pipe/filter processing                    | PASS                              | Operators are async-generator steps. Filtering is lazy; bounded top-K is the only eager/windowed operator. No I/O occurs in operators or policies.                                                                                                                                                                                                                  |
| Simplicity and YAGNI                           | PASS                              | No dependency or new architectural layer is introduced. Existing scaffold placeholders are completed or removed when obsolete.                                                                                                                                                                                                                                      |
| Deterministic domain rules                     | PASS WITH DOCUMENTATION FOLLOW-UP | This feature supports all filter/ranking combinations as clarified. Existing architecture docs currently pair long titles with comments and short titles with points; the user directed that architecture documentation be evolved after this implementation is complete. Capture that as a follow-up documentation task, not as a blocker or behavior restriction. |
| Feature requirements and bounded candidate set | PASS                              | Retrieve at most 30 source entries first, then filter, then rank up to 30; ties preserve source order/rank and missing metrics are zero.                                                                                                                                                                                                                            |

No unresolved architecture or behavior decision blocks planning. The earlier discrepancy about paired ranking policies is resolved by the clarification recorded in `spec.md`.

## Project Structure

### Documentation (this feature)

```text
specs/003-filter-sort-stories/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── crawl-cli.md
└── tasks.md              # Produced later by $speckit-tasks
```

### Source Code

```text
src/
├── domain/
│   └── policies/
│       └── entry-filter.policy.ts
├── application/
│   ├── ports/in/crawler.port.ts
│   ├── usecases/crawler.usecase.ts
│   └── pipeline/
│       ├── orchestrator/async.pipe.ts
│       ├── pipeline.types.d.ts
│       ├── operators/filter.ts
│       ├── operators/top-k.ts
│       ├── steps/filter-title-words.step.ts
│       └── factory/factory.ts
├── presentation/
│   ├── cli/crawl.ts
│   └── main.ts
└── infrastructure/
    └── web/                 # Existing source adapter; no feature changes expected

tests/
├── acceptance/
│   ├── features/crawl.feature
│   └── steps/crawl.steps.ts
└── unit/
    ├── domain/policies/entry-filter.policy.test.ts
    ├── application/pipeline/orchestrator/async.pipe.test.ts
    ├── application/pipeline/operators/filter.test.ts
    ├── application/pipeline/operators/top-k.test.ts
    ├── application/pipeline/steps/filter-title-words.step.test.ts
    ├── application/pipeline/factory/factory.test.ts
    ├── application/usecases/crawler.usecase.test.ts
    └── presentation/cli/crawl.test.ts
```

Create `src/application/pipeline/orchestrator/async.pipe.ts` as the async-only composition base, replacing the existing scaffolding at `orchestration/pipe.ts`; remove the old pipe and its tests once all references have moved. The pipe accepts an `AsyncIterable` source and composes `AsyncStep` values; no sync-source promotion is required. The suggested factory implementation remains inside the application layer. A type/port in the inbound application boundary will describe the factory contract so the use case does not import the concrete factory module. Composition root wiring injects the concrete factory.

The existing `top-by-comments.step.ts`, `top-by-points.step.ts`, and `composed/long-titles.pipeline.ts` / `short-titles.pipeline.ts` stubs are candidates for removal once replacement tests and imports are in place; tasks must confirm references before deleting. `top-k.ts` is an operator, while ranking selectors are provided by the pipeline factory. The top-K window is fixed by the crawler candidate limit at 30, so all qualifying candidates are retained and stable source-order ties are preserved.

**Structure Decision**: Continue the existing single-project, hexagonal TypeScript CLI structure. Keep shared pipeline primitives under `application/pipeline`, business predicates in `domain/policies`, and all concrete dependencies in `src/presentation/main.ts`. Acceptance tests remain external black-box process tests and must not reference `src` artifact paths.

## Incremental Review Milestones

Each milestone ends in a review checkpoint. Pause for the user's review and confirmation before beginning the next milestone. Keep the requested acceptance-test execution as the final milestone; do not run it earlier.

1. **Acceptance contract and acceptance tests (written first, not run)**: Add/update black-box Cucumber scenarios for defaults, explicit flag combinations, validation errors, output shape/order, and exit status. Remove source artifact path assumptions. Leave acceptance tests unexecuted (and expected to fail until implementation); keep existing unit tests, formatting, lint, and typecheck green. Do not claim the acceptance suite is green at this checkpoint.
2. **Pipeline foundations**: Add the proposed `orchestrator/async.pipe.ts`, async-only pipe types, and lazy `filter` and stable bounded `topK` operators; add table-driven unit tests for laziness, order, window bounds, tie stability, empty input, and failures. Remove the superseded `orchestration/pipe.ts` and its tests, along with obsolete scaffolding once unreferenced. Run the unit tests and quality gates.
3. **Domain policy and pipeline factory**: Add title word-count policy predicates and factory configuration for ranking (`comments` or `points`) plus optional title rule (`gt` or `le`, threshold). Test all combinations, defaults at the CLI boundary, missing metric values, ties, and no-match output. Keep factory construction injectable through an application-owned contract.
4. **Crawler use case and dependency wiring**: Extend the inbound crawler contract with filter/ranking parameters independent of `PipelineConfig`; have the use case obtain up to 30 source items, request a pipeline using scalar/domain-level config values, apply it, and return its output. Inject the factory at composition root. Add table-driven use-case tests asserting output, fetch/factory calls and exact arguments, source cutoff, and failure propagation. Run unit tests and quality gates.
5. **CLI options and error behavior**: Add `--top-comments`, `--top-points`, and `--title-words <rule>` parsing; default to `gt:5` and comments; reject conflicting ranking flags; show the exact maximum-value message; return non-zero for argument and crawler failures while preserving the existing crawler error message. Add/adjust CLI unit tests with consistent properties and `it should` wording. Run unit tests and quality gates.
6. **Final acceptance verification**: After review and explicit approval for this final milestone, run the acceptance suite against the configured URL/standalone CLI, verify successful/failed statuses and JSON behavior, then run the full documented quality gates. Do not execute this milestone locally before the user's review.
7. **Architecture documentation follow-up**: After the feature implementation is complete, update `docs/ARCHITECTURE.md` and the corresponding constitution domain rules to document any filter/ranking combination, superseding the current paired long-title/comments and short-title/points wording. Keep this separate from runtime implementation so the user can review the doc alignment.

## Complexity Tracking

No constitution violations are planned. The pipeline factory contract is required to preserve dependency inversion between the use case and concrete pipeline composition. The bounded top-K operator is required by the architecture and explicit memory-window requirement; the existing input limit of 30 makes its window equal to the candidate count.
