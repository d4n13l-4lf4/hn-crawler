# Research: Filter and Sort Hacker News Stories

## Decisions

### Async pipeline shape

- **Decision**: Create `application/pipeline/orchestrator/async.pipe.ts` as an AsyncIterable-to-AsyncIterable composition of `AsyncStep` functions, and remove the superseded `orchestration/pipe.ts` scaffold and its tests after references migrate.
- **Rationale**: This feature evolves the current scaffold to the requested pipeline structure. The async entry source is the only source shape needed, so the pipe can remain async-only without a sync-to-async adapter.
- **Alternatives considered**: Retain `orchestration/pipe.ts`; make pipe accept both sync and async sources. Retaining the old path conflicts with the requested architecture evolution; sync support broadens the API without a feature need.

### Bounded ranking operator

- **Decision**: Implement a stable descending `topK(k, selector)` async-generator operator that buffers no more than `k` entries and yields the selected entries in descending order, preserving input order for equal selector values. Configure `k` to 30 for this crawler pipeline.
- **Rationale**: This matches the architecture's bounded eager `eagerTopK` requirement. Since the use case first limits input to 30 candidates, ranking window 30 retains every matching candidate while keeping the generic operator independently reusable and bounded.
- **Alternatives considered**: Sort an unbounded complete source; use a full materializing array sort; use a heap. There are only 30 candidates in this feature. A stable bounded buffer/sort is simpler and is bounded by `k`.

### Domain predicate and pipeline factory boundary

- **Decision**: Put title-word predicate construction in `domain/policies/entry-filter.policy.ts`. Put the concrete pipeline factory in `application/pipeline/factory/factory.ts`, but describe its contract in an application inbound port/type consumed by the crawler use case. The composition root constructs and injects the concrete factory.
- **Rationale**: Policies keep business rules independent from stream mechanics. The use case depends on an abstraction rather than a concrete factory, and the composition root remains the only place that assembles concrete dependencies.
- **Alternatives considered**: Import the factory directly from the use case; pass pipeline implementation details to the CLI; add an infrastructure adapter. These break dependency inversion or add a layer without I/O responsibilities.

### Candidate set and ordering

- **Decision**: The crawler obtains at most the first 30 entries from the source, then filters and ranks those entries. Missing ranking values are zero; equal values retain source order/rank.
- **Rationale**: This matches clarification in the spec and the existing crawler source limit. Ranking window 30 prevents result loss after filtering.
- **Alternatives considered**: Crawl/paginate beyond the first 30. This is out of scope and would change the clarified candidate set.

### CLI acceptance and failure status

- **Decision**: Keep acceptance tests as standalone process-level Cucumber tests. Assert stdout/stderr and actual process status. Use the existing configured acceptance URL, with no `src` artifact paths in acceptance steps.
- **Rationale**: This meets FR-016 and the architecture/QA guidance. Existing acceptance steps already capture status, so expand only for the new behavior and audit away source paths.
- **Alternatives considered**: Invoke source modules directly or rely only on error text. Those do not validate the packaged CLI contract or exit status.

### Incremental delivery and verification

- **Decision**: Split implementation into reviewable milestones; keep unit/quality gates green at each accepted code milestone, and reserve acceptance execution for the final milestone after user review.
- **Rationale**: The user explicitly requires review checkpoints and says not to run acceptance tests before the end.
- **Alternatives considered**: Execute all steps in one change or run acceptance tests at each milestone; both conflict with the requested workflow.

## Scope and follow-up

The user clarified that all filter/ranking combinations are supported. The current architecture and constitution text still state fixed long-title/comments and short-title/points pairings. Runtime behavior follows the spec; documentation alignment is listed as a post-implementation follow-up for review.
