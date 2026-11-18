# Quickstart: Localize Usage Timestamps

## Validation

Run the focused usage command tests first, then the project quality gates and build:

```bash
npx vitest run tests/unit/presentation/cli/usage.test.ts
npm run quality
npm run build
```

The tests should cover UTC and non-UTC output, daylight-saving changes, UTC fallback, the `Request Date and Time` header, table alignment, and unchanged empty-history output. They must control timezone assumptions instead of depending on the runner's ambient local timezone.

See [usage timestamp display contract](contracts/usage-timestamp.md) and [data model](data-model.md).
