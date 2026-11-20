# Contract: Entry Source Port

**Feature**: 009-crawler-page-object-model  
**Date**: 2026-11-19  
**Status**: Unchanged (documented for reference)

## Interface

**File**: `src/application/ports/out/entry-source.port.ts`

```typescript
export interface EntrySourcePort {
  fetchEntries(url: string): AsyncIterable<HNEntry>;
}
```

## Contract Description

The `EntrySourcePort` is the application's driven port for sourcing Hacker News entries. It is implemented by `HnWebAdapter` (infrastructure). The POM refactor does **not** change this interface:

- Method signature `fetchEntries(url: string): AsyncIterable<HNEntry>` is unchanged
- Return type `AsyncIterable<HNEntry>` is unchanged
- The adapter continues to honor the port contract after delegating to the POM

## Consumer

- `src/application/usecases/crawler.usecase.ts` — consumes `EntrySourcePort` to crawl entries (unchanged)

## Impact of POM Refactor

None on the contract. The POM is an internal implementation detail of the `HnWebAdapter`; the port boundary and its consumers are untouched. No CLI command, option, or output format changes.
