# Implementation Plan: Web Crawler Page Object Model

**Branch**: `009-crawler-page-object-model` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-crawler-page-object-model/spec.md`

## Summary

Refactor the HN web crawler parser into a Page Object Model (POM) class whose single responsibility is extracting entries from the Hacker News page as they appear in the page. The POM receives the raw HTML in its constructor, initializes cheerio privately at instantiation, exposes an `hasEntries()` boolean check and an async-iterable entry extraction that terminates when no entries exist, and uses private methods to extract title, number of comments, points, and rank. The `hn-web.adapter.ts` is updated to use the POM. All other source code remains untouched. Functional behavior and existing acceptance scenarios are unchanged; no acceptance tests are implemented or automatically run for this feature. Delivery is incremental: each milestone leaves `npm run quality` green and is presented for review before the next begins.

## Technical Context

**Language/Version**: TypeScript strict mode; Node 26 LTS

**Primary Dependencies**: cheerio (existing dependency, no new packages)

**Storage**: N/A — no storage or schema change

**Testing**: Vitest unit tests with 100% coverage (statements, branches, functions, lines per file and aggregate); Cucumber acceptance intentionally not implemented or run for this feature

**Target Platform**: Node.js CLI

**Project Type**: Standalone CLI

**Performance Goals**: No change — retrieve no more than the first 30 entries; process only that bounded candidate set

**Constraints**: Respect hexagonal dependency direction (`presentation → application → domain`, `infrastructure → application (ports) + domain`); the POM lives in infrastructure and imports only domain; every implementation milestone must finish with `npm run quality` passing; acceptance is deferred to the user; behavior must be byte-identical to pre-refactor output; no new layers, folders, or dependencies

**Scale/Scope**: Parser refactor (`src/infrastructure/web/hn-crawler.parser.ts`) and adapter update (`src/infrastructure/web/hn-web.adapter.ts`) only; no new user-facing commands, options, or output formats

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Hexagonal architecture**: Pass. The POM is an infrastructure adapter concern. It imports only domain entities (`HNEntry`, `Title`, `Numeric`) and cheerio. The application layer and domain are untouched. `hn-web.adapter.ts` remains the infrastructure adapter implementing `EntrySourcePort`, now delegating to the POM.
- **Test-first development**: Pass. For each milestone, add/adjust unit tests first, confirm new tests fail, implement behavior, then run `npm run quality` before review. Acceptance tests are not implemented or run for this feature per the spec.
- **Pipes and filters**: N/A. This refactor concerns page parsing, not pipeline operators; pipeline behavior is unchanged.
- **Simplicity / YAGNI**: Pass. No new layers, folders, tools, or abstractions beyond the class-based POM requested. File naming keeps the kebab-case role suffix convention (`.parser.ts`). The parser file becomes the POM class; no separate POM file is added.
- **Deterministic domain rules**: Pass. The same parsing logic (selectors, rank, title, points, comments, zero defaults, ties) is preserved verbatim inside the POM's private methods.

No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/009-crawler-page-object-model/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── domain/
│   └── entities/hn-entry.entity.ts          # Unchanged
├── application/
│   └── ports/out/entry-source.port.ts        # Unchanged
└── infrastructure/
    └── web/
        ├── hn-crawler.parser.ts              # POM class (was parseHnEntries function)
        ├── hn-web.adapter.ts                 # Updated to use the POM
        └── hn-http.client.ts                 # Unchanged

tests/
└── unit/
    └── infrastructure/web/
        ├── hn-crawler.parser.test.ts         # POM unit tests (test-first, table-driven)
        └── hn-web.adapter.test.ts            # Adapter unit tests (updated for POM)
```

**Structure Decision**: Single project (DEFAULT). Use existing modules only; do not add a new layer or folder. The existing `hn-crawler.parser.ts` file becomes the POM class. The adapter is the only other source file touched. Tests mirror the affected source modules under `tests/unit/infrastructure/web/`.

## Incremental Delivery and Review Milestones

### Milestone 1: POM class in `hn-crawler.parser.ts` + unit tests

Convert `src/infrastructure/web/hn-crawler.parser.ts` from the `parseHnEntries` standalone function to a POM class:

- Constructor receives `html: string`, initializes cheerio into a private property
- `hasEntries(): boolean` — returns whether any entry exists on the page
- Async-iterable method — checks entries first; terminates iterator when none; otherwise yields entries one by one
- Private methods for extracting title, number of comments, points, and rank from a story row
- Parsing logic and output (`HNEntry` with rank, title, points, comments) identical to the previous function

Add table-driven unit tests using `it should when` wording covering: `hasEntries` true/false, async iteration yielding entries, empty page termination, missing metadata defaults to zero, and all-sample-entries source order. Verify new tests fail before implementation, then implement, then run `npm run quality`.

**Review gate**: `npm run quality` green; no acceptance tests run.

### Milestone 2: Use the POM in `hn-web.adapter.ts`

Update `src/infrastructure/web/hn-web.adapter.ts` to instantiate the POM with the fetched HTML and delegate entry iteration to it, replacing the `parseHnEntries` import/call. The `EntrySourcePort` interface and `fetchEntries(url)` signature remain unchanged.

Update adapter unit tests to exercise the POM integration. Verify new tests fail before implementation, then implement, then run `npm run quality`.

**Review gate**: `npm run quality` green; no acceptance tests run.

### Milestone 3: Remove obsolete code and finalize

Delete the old `parseHnEntries` function export and any now-unused imports/code. Confirm no references to the removed function remain. Run `npm run quality` (format, format:check, lint, typecheck, test:coverage) and confirm the aggregate gate is green.

**Review gate**: `npm run quality` green; codebase in a clean, green state ready for user review.

### Final user-run acceptance

After all milestones are reviewed and approved, the user may run the acceptance suite against the configured deterministic URL to confirm behavior preservation. The agent does not execute Cucumber. Any user-reported failure becomes a focused follow-up milestone that must leave `npm run quality` green.

## Complexity Tracking

No additional architecture or constitution exceptions are required.

## Planning Clarification — 2026-11-19

No clarifications required. The spec is explicit: POM single responsibility is entry extraction; constructor receives raw HTML; cheerio initialized privately; `hasEntries()` returns boolean; async iterable terminates on no entries; private methods extract title/comments/points/rank; POM used in hn adapter; remaining source untouched; no acceptance tests implemented or run.
