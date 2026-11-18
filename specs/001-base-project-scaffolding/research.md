# Research: Base Project Scaffolding

**Feature**: 001-base-project-scaffolding
**Date**: 2026-11-17

---

## 1. Vitest 100% Coverage with Composition Root Exclusion

**Decision**: Use Vitest coverage configuration with `exclude` pattern for `src/presentation/main.ts` and `coverage.thresholds` set to 100 for lines, functions, branches, statements.

**Rationale**: The project quality requirements require 100% unit-test coverage, excluding the composition root. Vitest's v8 provider supports per-file exclusion and threshold enforcement.

**Alternatives Considered**:

- Istanbul/nyc — Older, less integrated with Vitest
- Custom coverage script — Unnecessary complexity; Vitest handles this natively

**Configuration**:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      exclude: ['src/presentation/main.ts', 'tests/**', '**/*.d.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
```

---

## 2. Cucumber Acceptance Tests Against Published Beta

**Decision**: Acceptance tests use `@cucumber/cucumber` with a `World` class that spawns the installed `hn-crawler` binary via `child_process`. Tests run in `tests/acceptance/` with features in `features/` and step definitions in `steps/`.

**Rationale**: CICD.md states: "Locally it is the compiled build; in CI it is the published beta package." The acceptance tests must work both ways — against local `dist/` during development and against `npm install hn-crawler@beta` in CI.

**Alternatives Considered**:

- Direct import of CLI module — Violates "run as a process" requirement from QUALITY.md
- Shell script tests — Less maintainable, no Gherkin readability

**Implementation Pattern**:

```typescript
// tests/acceptance/steps/world.ts
import { Before, After, World } from '@cucumber/cucumber';
import { spawn, ChildProcess } from 'child_process';

export class CliWorld extends World {
  private cliPath: string;
  private process?: ChildProcess;

  constructor(options: any) {
    super(options);
    // Resolve CLI path: local dist/ or global install
    this.cliPath = process.env.HN_CRAWLER_BIN ?? './dist/presentation/main.js';
  }

  async runCli(
    args: string[]
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      this.process = spawn('node', [this.cliPath, ...args], {
        stdio: 'orchestration',
      });
      let stdout = '',
        stderr = '';
      this.process.stdout?.on('data', (d) => (stdout += d));
      this.process.stderr?.on('data', (d) => (stderr += d));
      this.process.on('close', (code) =>
        resolve({ stdout, stderr, code: code ?? 0 })
      );
    });
  }
}
```

---

## 3. GitHub Actions Beta Versioning

**Decision**: Use `git rev-parse --short HEAD` to get short SHA, combine with `package.json` version for beta tag: `${version}-beta.sha${shortSha}`. Publish to npm with `--tag beta`.

**Rationale**: CICD.md specifies exact format: `<package.json version>-beta.sha<short commit SHA>`, e.g., `1.0.0-beta.sha1a2b3c4`. This is valid semver and unique per commit.

**Alternatives Considered**:

- GitHub Actions `github.sha` — Available but longer; short SHA is convention
- Build number — Not unique across forks/branches; commit SHA is globally unique

**Workflow Snippet**:

```yaml
# .github/workflows/beta-release.yml
- name: Get version
  id: version
  run: |
    VERSION=$(node -p "require('./package.json').version")
    SHA=$(git rev-parse --short HEAD)
    echo "beta_version=${VERSION}-beta.sha${SHA}" >> $GITHUB_OUTPUT
- name: Publish to npm beta
  run: npm publish --tag beta --access public
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 4. Husky Pre-commit with Four Quality Gates

**Decision**: Husky v9+ with a `pre-commit` hook that runs `npm run quality` (which sequences `format:check`, `lint`, `typecheck`, `test:coverage`). Fail fast on first failure.

**Rationale**: QUALITY.md defines four gates that must pass on every commit. Husky is the mandated tool (CICD.md). The `quality` script aggregates all gates.

**Alternatives Considered**:

- lint-staged — Only runs on staged files; we need full project typecheck/test
- Separate hooks per gate — Slower, more complex; single `quality` script is simpler

**package.json Scripts**:

```json
{
  "scripts": {
    "format:check": "prettier --check .",
    "lint": "eslint src tests",
    "typecheck": "tsc --noEmit",
    "test:coverage": "vitest run --coverage",
    "quality": "npm run format:check && npm run lint && npm run typecheck && npm run test:coverage",
    "test:acceptance": "cucumber-js tests/acceptance",
    "build": "tsc",
    "prepare": "husky install"
  }
}
```

---

## 5. TypeScript Strict Config for Hexagonal Architecture

**Decision**: `tsconfig.json` with `strict: true`, `moduleResolution: node`, `baseUrl: .`, `paths` for clean imports (`@domain/*`, `@application/*`, etc.), `declaration: true`, `declarationMap: true`, `outDir: dist`, `rootDir: src`.

**Rationale**: ARCHITECTURE.md mandates TypeScript strict mode, no bundler, `tsc` compilation to `dist/`. Path aliases enforce layer boundaries and make imports readable.

**Alternatives Considered**:

- Relative imports only — Verbose, fragile to refactoring
- `moduleResolution: bundler` — Not needed; we use `tsc` directly

**Configuration**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@application/*": ["src/application/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@presentation/*": ["src/presentation/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## Summary of Decisions

| Topic                   | Decision                                       | Constitutional Basis |
| ----------------------- | ---------------------------------------------- | -------------------- |
| Coverage exclusion      | Vitest `exclude: ['src/presentation/main.ts']` | QUALITY.md           |
| Acceptance test runtime | Spawn installed CLI binary via child_process   | QUALITY.md, CICD.md  |
| Beta version format     | `${version}-beta.sha${shortSha}`               | CICD.md              |
| Pre-commit gates        | Husky runs `npm run quality` (4 gates)         | QUALITY.md, CICD.md  |
| TypeScript config       | Strict, path aliases, NodeNext modules         | ARCHITECTURE.md      |
