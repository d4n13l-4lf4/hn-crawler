# Research: Refactor for Esbuild Bundle Compatibility

**Feature**: 013-esbuild-bundle-compatibility  
**Date**: 2026-11-20  
**Status**: Complete — all design decisions resolved

## Decision: CLI version via `__APP_VERSION__` bundled variable

**Decision**:

- `src/presentation/cli/cli.ts` currently reads `package.json` at runtime via `resolve(dirname(__dirname), '../../package.json')` and `readFileSync`. This breaks when bundled with esbuild because `__dirname` is not available in ESM bundled code, and the bundled file no longer has access to the source tree's `package.json`.
- Replace this with the `__APP_VERSION__` bundled variable, which `esbuild.config.mts` already defines as `JSON.stringify(packageJson.version)` (line 21). esbuild's `define` replaces `__APP_VERSION__` with the version string literal at build time, so no runtime file read is needed.
- Remove the now-unused `readFileSync` import from `node:fs` and `dirname`/`resolve` imports from `node:path` in `cli.ts` if they are not used elsewhere in the file.

**Rationale**: Directly implements the user's constraint — use `__APP_VERSION__` instead of reading package.json. esbuild already performs the substitution at build time; no new build configuration is needed.

**Alternatives considered**:

- Keep reading `package.json` at runtime and copy it into `dist/` — rejected: fragile, requires build step to copy package.json, and `__dirname` is unavailable in ESM bundle.
- Read version from a generated version file — rejected: adds a new build step and file; `__APP_VERSION__` is already defined and simpler.

## Decision: Migration file location via `import.meta.url`

**Decision**:

- `src/infrastructure/persistence/sqlite/sqlite-migrator.ts` currently locates `drizzle/migrations` using `__dirname` candidates (`resolve(__dirname, '../../../../drizzle/migrations')` and `resolve(__dirname, '../../../drizzle/migrations')`). This breaks when bundled because `__dirname` is unavailable in ESM bundled code, and the bundled file (`dist/main.js`) is at the repo root's `dist/`, not deep in `src/`.
- Replace with `import.meta.url` converted via `fileURLToPath` from `node:url`, then resolve to `../drizzle/migrations` relative to `dist/main.js`'s directory (`dist/` → repo root → `drizzle/migrations`).

**Rationale**: Directly implements the user's constraint — use `import.meta.url` to locate migration files under the bundled file's location. `import.meta.url` is available because the project uses `"type": "module"` and `module: ESNext` / `moduleResolution: Bundler` in tsconfig.

**Alternatives considered**:

- Keep `__dirname` candidates and add a third candidate for `dist/` — rejected: `__dirname` is unavailable in ESM bundle, so no candidate would work.
- Hardcode an absolute or relative path from `process.cwd()` — rejected: depends on working directory, breaks when CLI is run from a different directory (edge case in spec).
- Embed migrations as strings in the bundle — rejected: adds significant complexity; violates Simplicity/YAGNI.

## Decision: No acceptance tests

**Decision**: Per the spec, no acceptance tests (Cucumber/Gherkin) are implemented or automatically run by the agent. The existing acceptance scenarios remain unmodified (no functional change), per spec FR-004/SC-003. The agent does not execute Cucumber.

**Rationale**: The spec explicitly states acceptance tests won't change and none are to be implemented or automatically run.

## Open Items

None. All design decisions are resolved; no `[NEEDS CLARIFICATION]` markers remain.
