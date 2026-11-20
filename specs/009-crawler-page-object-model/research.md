# Research: Web Crawler Page Object Model

**Feature**: 009-crawler-page-object-model  
**Date**: 2026-11-19  
**Status**: Complete — no unresolved NEEDS CLARIFICATION items

## Decisions

### Decision: Convert `hn-crawler.parser.ts` to a class-based POM

**Decision**: The existing `src/infrastructure/web/hn-crawler.parser.ts` file is refactored from exporting a `parseHnEntries` standalone async generator function to exporting a POM class (`HnCrawlerParser`).

**Rationale**: The feature specification requires a Page Object Model whose single responsibility is getting entries from the web page as they are in the page. The POM must receive raw HTML in its constructor, initialize cheerio privately, expose `hasEntries(): boolean`, expose an async-iterable entry extraction, and use private methods for title/comments/points/rank extraction. A class best encapsulates this state (the cheerio instance) and behavior.

**Alternatives considered**:

- Keep `parseHnEntries` as a function and create a separate POM class file — rejected: the spec points to `infrastructure/hn-crawler.parser.ts` as the POM location, and adding a separate file would violate Simplicity/YAGNI (an extra file without a new role).
- Create a new `hn-page-object.ts` file alongside the parser — rejected: same reason; the parser file is the natural home and the spec names it.

### Decision: Class name `HnCrawlerParser`

**Decision**: The POM class is named `HnCrawlerParser`, matching the existing file name `hn-crawler.parser.ts` (kebab-case file, PascalCase class, consistent with `HnWebAdapter` in `hn-web.adapter.ts`).

**Rationale**: Follows the project's existing naming conventions (file kebab-case with role suffix `.parser.ts`; class PascalCase matching the domain concept).

### Decision: Async-iterable via `[Symbol.asyncIterator]()`

**Decision**: The POM exposes an async-iterable method implemented as `[Symbol.asyncIterator]()` so the object itself is `AsyncIterable<HNEntry>`, allowing `for await (const entry of pom)` and `yield*` delegation from the adapter.

**Rationale**: The adapter currently does `yield* this.parser.parse(html)`. Making the POM itself async-iterable lets the adapter do `yield* this.pom` (after constructing it with HTML), preserving the existing call shape with minimal adapter change.

### Decision: Private cheerio property initialized in constructor

**Decision**: The constructor takes `html: string`, calls `load(html)`, and assigns the result to a private readonly property (e.g., `#$` or private `$`).

**Rationale**: Matches the spec ("Initialize cheerio at instantiation assigning it to a private property") and keeps cheerio usage encapsulated inside the POM.

### Decision: No new dependencies

**Decision**: cheerio remains the only HTML parsing dependency; it is already in `package.json`.

**Rationale**: No new libraries are needed; the existing cheerio API (`load`, `find`, `toArray`, `next`, `text`, `exec`) supports all required extraction.

### Decision: No acceptance tests for this feature

**Decision**: Per the spec, no acceptance tests (Cucumber/Gherkin) are implemented or automatically run. The existing acceptance scenarios from prior features continue to encode expected behavior but are unchanged.

**Rationale**: Explicitly stated in the feature specification.

## Open Items

None. All aspects of the POM design are determined by the specification; no NEEDS CLARIFICATION markers remain.
