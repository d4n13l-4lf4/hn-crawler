# Implementation Plan: Best-Effort Usage Tracking

**Branch**: `004-usage-tracking` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-usage-tracking/spec.md`

## Summary

Add best-effort tracking around the crawler use case and a `usage` CLI subcommand that returns the process-local history as JSON. The domain will own the usage record and an applied-filters value object whose builder hides the serialized tag syntax. An application mapper will translate the normalized crawl request into that value object. A usage repository output port will be implemented by a minimal in-memory adapter and shared by the tracking decorator and usage query command through the composition root. Use Node 26's native `crypto.randomUUIDv7`; add no dependency and no persistent storage.

The tracking decorator wraps the existing crawler use case. It captures request timestamp and a monotonic start time before delegation, then records one usage entity on success or failure. Repository failures are swallowed so success values and original crawl errors remain unchanged. The usage command reads the repository and returns a JSON array in insertion order; its history lasts only for the current process lifetime.

## Technical Context

**Language/Version**: TypeScript 5.7 strict mode; Node.js 26 LTS

**Primary Dependencies**: Commander 12, Node `crypto.randomUUIDv7`, native timing APIs, Vitest, Cucumber; no new dependencies

**Storage**: In-memory list scoped to the composition-root process lifetime; persistence is explicitly excluded

**Testing**: Vitest table-driven unit tests using `it should when` wording and mock argument assertions; black-box Cucumber acceptance tests are authored but execution is out of scope for this feature; 100% unit coverage excluding composition root

**Target Platform**: Node.js CLI on developer and CI platforms

**Project Type**: Single TypeScript CLI project

**Performance Goals**: Usage recording is best effort and must not delay the crawl beyond synchronous in-memory append and entity construction; history retrieval preserves insertion order

**Constraints**: Follow `presentation → application → domain` and `infrastructure → application ports + domain`; domain code remains dependency-free; only composition root creates concrete adapters; tracking failure cannot affect crawler result or error; `usage` accepts no feature-specific options; no database/cache/file persistence

**Scale/Scope**: One record per crawl invocation in a process-local list; fields are request UUIDv7, UTC Unix-millisecond start timestamp, applied-filter string, and non-negative integer duration

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                  | Status                    | Plan response                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hexagonal architecture and dependency rule | PASS                      | The domain entity/value object remain pure. The application owns repository and crawler interfaces, mapper, and tracking decorator. The infrastructure adapter implements the repository port. The composition root shares the adapter between crawler decoration and usage retrieval. |
| Test-first development                     | PASS WITH SCOPE DECISION | Write the black-box acceptance scenarios first and leave them unrun because acceptance execution is out of scope for this feature. Keep unit/static quality gates green at each reviewed milestone.                                                                                 |
| Pipes and filters with pure functions      | PASS                      | Existing crawler pipeline remains unchanged. Tracking is an application use-case decorator; storage side effects remain in the infrastructure adapter.                                                                                                                                 |
| Simplicity and YAGNI                       | PASS                      | Use the requested value object, mapper, decorator, port, and in-memory adapter. No persistence, third-party UUID library, or unrelated instrumentation is added.                                                                                                                       |
| Deterministic domain rules                 | PASS                      | Applied-filter labels and their ordering are explicit; timestamp, duration, empty-history, and process-lifetime behaviors are testable.                                                                                                                                                |

No constitution violation is planned. No unresolved spec detail blocks design.

## Research Decisions

- Use Node 26 `crypto.randomUUIDv7()` for request IDs. It is available in the pinned runtime and avoids adding a package.
- Represent applied filters as an ordered list of semantic tags inside the value object; expose a builder for supported sort and title rules and serialize using the canonical labels defined by the spec. For no title filter, omit the title tag entirely. Sort tag comes first, title tag second.
- Measure elapsed duration using a monotonic clock and store an integer millisecond count; capture request timestamp separately with UTC Unix milliseconds at request start.
- Wrap the core crawler use case with `TrackedCrawlerUseCase`. Build tracking metadata from the same normalized `CrawlRequest` passed to the core use case. In a `finally`-style path, persist exactly one record for success and failure; catch repository errors locally. Re-throw the original crawler failure unchanged.
- Expose the in-memory repository through a narrow output port with `save` and `getAll` operations. Return a copy of the record list from retrieval so callers cannot mutate repository state.
- The `usage` subcommand serializes only the four required public fields, excluding any repository-only identity. With separate CLI process invocations, the array starts empty by design.

## Project Structure

### Documentation (this feature)

```text
specs/004-usage-tracking/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── usage-cli.md
├── quickstart.md
└── tasks.md
```

### Source Code

```text
src/
├── domain/
│   ├── entities/usage.entity.ts
│   └── value-objects/applied-filters.vo.ts
├── application/
│   ├── mappers/applied-filters.mapper.ts
│   ├── ports/
│   │   ├── in/crawler.port.ts                 # Existing request contract; no behavior change
│   │   └── out/usage-repository.port.ts
│   └── usecases/
│       └── decorators/tracked-crawler.usecase.ts
├── infrastructure/
│   └── persistence/in-memory/in-memory.repository.ts
└── presentation/
    ├── cli/
    │   ├── crawl.ts                            # Inject decorated crawler
    │   ├── usage.ts
    │   └── cli.ts                              # Existing generic command builder
    └── main.ts                                 # Share repository and wire decorator/commands

tests/
├── acceptance/
│   ├── features/usage.feature
│   └── steps/usage.steps.ts
└── unit/
    ├── domain/entities/usage.entity.test.ts
    ├── domain/value-objects/applied-filters.vo.test.ts
    ├── application/mappers/applied-filters.mapper.test.ts
    ├── application/usecases/decorators/tracked-crawler.usecase.test.ts
    ├── infrastructure/persistence/in-memory/in-memory.repository.test.ts
    └── presentation/cli/usage.test.ts
```

The `usage` process-local limitation means ordinary independent CLI invocations cannot share history. Each standalone `usage` acceptance invocation therefore returns `[]`, even after a separate `crawl` invocation. Unit tests exercise tracking, populated history, ordering, and serialization with shared in-process components.

**Structure Decision**: Extend the existing single-project hexagonal CLI. Keep tracking behavior in an application decorator, semantic rules in domain types, process-local storage in an infrastructure adapter, and concrete wiring in `src/presentation/main.ts`. No SQLite repository is added as part of this feature.

## Incremental Review Milestones

Each implementation milestone ends at a review checkpoint. Pause for the user's review and confirmation before starting the next. Acceptance tests are written first but execution is out of scope for this feature; run the unit and static quality gates at implementation milestones.

1. **Acceptance contract first (write, do not run)**: Add black-box scenarios for usage empty state, record schema/order, all effective filter combinations, crawl success/failure tracking, unsupported usage args, and process restart semantics. Avoid source-path coupling. Run formatting, lint, and typecheck only; pause for review.
2. **Domain usage model**: Add `Usage` entity and `AppliedFilters` value object/builder. Test UUID/request fields, duration validation, canonical sort/title tags, combined tag ordering, and omission of title tag when absent using table-driven `it should when` tests with value/object outcomes. Run non-acceptance gates; pause for review.
3. **Repository port and in-memory adapter**: Define `UsageRepositoryPort.save` and `getAll`, implement list-backed storage with insertion ordering and defensive retrieval copies, and add tests for empty state, sequential appends, returned records, and isolation. Run non-acceptance gates; pause for review.
4. **Applied-filter mapper**: Map the normalized crawl request to the domain value object, including effective comments default, title-only requests, ranking-only requests, and no-option defaults as represented by the request passed from CLI. Assert mapper results and inputs table-wise. Run non-acceptance gates; pause for review.
5. **Tracking decorator**: Wrap the crawler use case; capture timestamp and monotonic start, record one result for success and failure, preserve the exact returned entries or original thrown error, and swallow record-construction/repository failures. Add table-driven decorator tests with assertions for clock/ID/repository calls and exact arguments; run non-acceptance gates; pause for review.
6. **Usage CLI and composition wiring**: Add `usage` command with no supported options/arguments and JSON array output, wire one repository instance into the decorator and usage command, and inject the decorated crawler into `crawl`. Add CLI tests for empty and populated history plus argument errors; keep crawler failure output unchanged. Run all unit tests and non-acceptance gates; pause for review.
7. **Acceptance execution**: Out of scope for this feature. Keep the black-box scenarios authored for later use; do not run them as part of this feature.

## Complexity Tracking

No violations planned. The decorator and repository port are required by the requested architecture and best-effort cross-cutting tracking. The in-memory adapter is intentionally minimal and scoped to process lifetime.

## Convergence Clarification (Append-Only)

- Usage history is intentionally held only in the current process. Each standalone CLI acceptance invocation starts a fresh process, so `hn-crawler usage` returns `[]` in the acceptance workflow even after a separate `crawl` invocation.
- Acceptance coverage for this feature is limited to black-box CLI behavior that can be observed across independent invocations, including empty usage output, CLI registration, unsupported arguments, and process restart behavior. Crawl tracking scenarios will not be added to or reviewed as acceptance tests in this feature; request mapping, record creation, failure handling, and serialization are covered by unit tests using shared in-process components.
- No persistence or cross-process mechanism should be added to make acceptance history non-empty. Such storage is outside this feature's scope.
- This clarification supersedes the earlier wording in this plan that proposed a final acceptance execution milestone and suggested populated-history acceptance coverage. Acceptance scenarios remain authored, but executing them is out of scope for this feature.
